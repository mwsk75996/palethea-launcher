
import { useState, useEffect } from 'react';
import './VersionSelector.css';

function VersionSelector({
    versions,
    selectedVersion,
    onSelect,
    onRefresh,
    loading,
    title = "Select Version",
    showFilters = true
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [enabledTypes, setEnabledTypes] = useState(['release']);

    const filteredVersions = versions.filter((v) => {
        const matchesFilter = !showFilters || enabledTypes.length === 0 || enabledTypes.includes(v.version_type);
        const matchesSearch = (v.id || v.version).toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const toggleType = (type) => {
        setEnabledTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    const formatDate = (isoStr) => {
        if (!isoStr) return 'Unknown';
        try {
            const date = new Date(isoStr);
            return date.toLocaleDateString(undefined, { year: '2-digit', month: 'numeric', day: 'numeric' });
        } catch {
            return isoStr;
        }
    };

    const versionTypes = [
        { id: 'release', label: 'Releases' },
        { id: 'snapshot', label: 'Snapshots' },
        { id: 'old_beta', label: 'Betas' },
        { id: 'old_alpha', label: 'Alphas' },
    ];

    const hasAnyDates = versions.some(v => v.release_time);
    const latestReleaseId = versions.find(ver => ver.version_type === 'release')?.id;

    return (
        <div className="version-selector-component">
            <div className="version-selector-main">
                <div className="version-table-wrapper">
                    <div className={`version-table-header ${!hasAnyDates ? 'no-dates' : ''}`}>
                        <div className="v-id">Version</div>
                        {hasAnyDates && <div className="v-date">Released</div>}
                        <div className="v-type">Type</div>
                    </div>
                    <div className="version-table-list">
                        {loading ? (
                            <div className="version-loading">
                                <div className="spinner-ring"></div>
                                <span>Fetching version data...</span>
                            </div>
                        ) : filteredVersions.length === 0 ? (
                            <div className="version-loading">No versions found</div>
                        ) : filteredVersions.map((v) => {
                            const id = v.id || v.version;
                            const isSelected = selectedVersion === id;
                            const isLatest = id === latestReleaseId || v.version_type === 'recommended';

                            return (
                                <div
                                    key={id}
                                    className={`version-row ${isSelected ? 'selected' : ''} ${!hasAnyDates ? 'no-dates' : ''}`}
                                    onClick={() => onSelect(id)}
                                >
                                    <div className="v-id">
                                        {isLatest && <span className="latest-star">★</span>}
                                        {id}
                                    </div>
                                    {hasAnyDates && <div className="v-date">{formatDate(v.release_time)}</div>}
                                    <div className="v-type">{v.version_type}</div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="version-search-box">
                        <input
                            type="text"
                            className="version-search-input"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {onRefresh && (
                            <button className="refresh-btn" onClick={onRefresh}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
                            </button>
                        )}
                    </div>
                </div>

                {showFilters && (
                    <div className="version-sidebar-mini">
                        <div className="version-filter-group">
                            <h3>Filter</h3>
                            {versionTypes.map(t => (
                                <label key={t.id} className="filter-checkbox-item">
                                    <input
                                        type="checkbox"
                                        checked={enabledTypes.includes(t.id)}
                                        onChange={() => toggleType(t.id)}
                                    />
                                    <span>{t.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default VersionSelector;
