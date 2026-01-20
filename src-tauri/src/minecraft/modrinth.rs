use serde::{Deserialize, Serialize};
use std::error::Error;
use std::fs::{self, File};
use std::io::Write;
use std::path::PathBuf;
use std::sync::LazyLock;
use tokio::sync::Semaphore;

const MODRINTH_API_BASE: &str = "https://api.modrinth.com/v2";
const USER_AGENT: &str = "PaletheaLauncher/0.1.0 (github.com/PaletheaLauncher)";

// Rate limiter: Modrinth allows ~300 requests/min, we'll be conservative with 10 concurrent
static MODRINTH_SEMAPHORE: LazyLock<Semaphore> = LazyLock::new(|| Semaphore::new(10));

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ModrinthProject {
    pub slug: String,
    pub title: String,
    pub description: String,
    pub project_type: String,
    pub downloads: u64,
    pub icon_url: Option<String>,
    pub project_id: String,
    #[serde(default)]
    pub author: String,
    #[serde(default)]
    pub categories: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ModrinthSearchResult {
    pub hits: Vec<ModrinthProject>,
    pub offset: u32,
    pub limit: u32,
    pub total_hits: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ModrinthVersion {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub version_number: String,
    pub game_versions: Vec<String>,
    pub loaders: Vec<String>,
    pub files: Vec<ModrinthFile>,
    pub dependencies: Vec<ModrinthDependency>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ModrinthFile {
    pub url: String,
    pub filename: String,
    pub primary: bool,
    pub size: u64,
    pub hashes: ModrinthHashes,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ModrinthHashes {
    pub sha1: Option<String>,
    pub sha512: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ModrinthDependency {
    pub version_id: Option<String>,
    pub project_id: Option<String>,
    pub dependency_type: String,
}

/// Search for projects on Modrinth
pub async fn search_projects(
    query: &str,
    project_type: &str, // "mod", "resourcepack", "shader"
    game_version: Option<&str>,
    loader: Option<&str>,
    limit: u32,
    offset: u32,
) -> Result<ModrinthSearchResult, Box<dyn Error + Send + Sync>> {
    // Acquire rate limit permit
    let _permit = MODRINTH_SEMAPHORE.acquire().await?;
    
    let client = reqwest::Client::new();
    
    let mut facets = vec![format!("[\"project_type:{}\"]", project_type)];
    
    if let Some(version) = game_version {
        facets.push(format!("[\"versions:{}\"]", version));
    }
    
    if let Some(loader) = loader {
        facets.push(format!("[\"categories:{}\"]", loader));
    }
    
    let facets_str = format!("[{}]", facets.join(","));
    
    let url = format!(
        "{}/search?query={}&facets={}&limit={}&offset={}",
        MODRINTH_API_BASE,
        urlencoding::encode(query),
        urlencoding::encode(&facets_str),
        limit,
        offset
    );
    
    let response = client
        .get(&url)
        .header("User-Agent", USER_AGENT)
        .send()
        .await?;
    
    let result: ModrinthSearchResult = response.json().await?;
    Ok(result)
}

/// Get versions for a project
pub async fn get_project_versions(
    project_id: &str,
    game_version: Option<&str>,
    loader: Option<&str>,
) -> Result<Vec<ModrinthVersion>, Box<dyn Error + Send + Sync>> {
    // Acquire rate limit permit
    let _permit = MODRINTH_SEMAPHORE.acquire().await?;
    
    let client = reqwest::Client::new();
    
    let mut url = format!("{}/project/{}/version", MODRINTH_API_BASE, project_id);
    
    let mut params = Vec::new();
    if let Some(version) = game_version {
        params.push(format!("game_versions=[\"{}\"]", version));
    }
    if let Some(loader) = loader {
        params.push(format!("loaders=[\"{}\"]", loader));
    }
    
    if !params.is_empty() {
        url = format!("{}?{}", url, params.join("&"));
    }
    
    let response = client
        .get(&url)
        .header("User-Agent", USER_AGENT)
        .send()
        .await?;
    
    let versions: Vec<ModrinthVersion> = response.json().await?;
    Ok(versions)
}

/// Download a file from Modrinth
pub async fn download_mod_file(
    file: &ModrinthFile,
    destination: &PathBuf,
) -> Result<(), Box<dyn Error + Send + Sync>> {
    // Acquire rate limit permit
    let _permit = MODRINTH_SEMAPHORE.acquire().await?;
    
    let client = reqwest::Client::new();
    
    // Create parent directories
    if let Some(parent) = destination.parent() {
        fs::create_dir_all(parent)?;
    }
    
    let response = client
        .get(&file.url)
        .header("User-Agent", USER_AGENT)
        .send()
        .await?;
    
    let bytes = response.bytes().await?;
    let mut out_file = File::create(destination)?;
    out_file.write_all(&bytes)?;
    
    Ok(())
}

/// Get project details
pub async fn get_project(project_id: &str) -> Result<ModrinthProject, Box<dyn Error + Send + Sync>> {
    // Acquire rate limit permit
    let _permit = MODRINTH_SEMAPHORE.acquire().await?;
    
    let client = reqwest::Client::new();
    
    let url = format!("{}/project/{}", MODRINTH_API_BASE, project_id);
    
    let response = client
        .get(&url)
        .header("User-Agent", USER_AGENT)
        .send()
        .await?;
    
    let project: ModrinthProject = response.json().await?;
    Ok(project)
}
