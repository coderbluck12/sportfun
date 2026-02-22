import { useState, useMemo } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import HighlightCard from '../components/HighlightCard'
import VideoModal from '../components/VideoModal'
import { highlights, leagues, type Highlight } from '../data/highlights'
import './HighlightsPage.css'

const sortOptions = ['Newest', 'Most Viewed', 'Oldest']

export default function HighlightsPage() {
    const [activeLeague, setActiveLeague] = useState('All')
    const [query, setQuery] = useState('')
    const [sortBy, setSortBy] = useState('Newest')
    const [activeVideo, setActiveVideo] = useState<Highlight | null>(null)

    const filtered = useMemo(() => {
        let list = [...highlights]

        if (activeLeague !== 'All') {
            list = list.filter(h => h.league === activeLeague)
        }

        if (query.trim()) {
            const q = query.toLowerCase()
            list = list.filter(h =>
                h.title.toLowerCase().includes(q) ||
                h.teams.toLowerCase().includes(q) ||
                h.league.toLowerCase().includes(q)
            )
        }

        if (sortBy === 'Most Viewed') {
            list.sort((a, b) => parseFloat(b.views) - parseFloat(a.views))
        }

        return list
    }, [activeLeague, query, sortBy])

    return (
        <div className="highlights-page">
            {/* Page Header */}
            <section className="hpage__hero">
                <div className="hpage__hero-bg" />
                <div className="container hpage__hero-content">
                    <div className="section-label">All Highlights</div>
                    <h1 className="hpage__title">Football Highlights</h1>
                    <p className="hpage__subtitle">
                        Every goal. Every save. Every moment that matters — all in one place.
                    </p>
                </div>
            </section>

            {/* Controls */}
            <section className="hpage__controls">
                <div className="container hpage__controls-inner">
                    {/* Search */}
                    <div className="hpage__search">
                        <Search size={16} className="hpage__search-icon" />
                        <input
                            type="text"
                            placeholder="Search highlights, teams, leagues..."
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            className="hpage__search-input"
                            id="highlight-search"
                        />
                    </div>

                    {/* League Filters */}
                    <div className="hpage__filters">
                        {leagues.map(l => (
                            <button
                                key={l}
                                className={`hpage__filter-btn ${activeLeague === l ? 'active' : ''}`}
                                onClick={() => setActiveLeague(l)}
                            >
                                {l}
                            </button>
                        ))}
                    </div>

                    {/* Sort */}
                    <div className="hpage__sort">
                        <SlidersHorizontal size={14} />
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value)}
                            className="hpage__sort-select"
                        >
                            {sortOptions.map(s => <option key={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
            </section>

            {/* Results */}
            <section className="hpage__results">
                <div className="container">
                    <div className="hpage__results-header">
                        <span className="hpage__count">{filtered.length} highlight{filtered.length !== 1 ? 's' : ''}</span>
                        {activeLeague !== 'All' && (
                            <span className="badge badge-green">{activeLeague}</span>
                        )}
                    </div>

                    {filtered.length > 0 ? (
                        <div className="hpage__grid">
                            {filtered.map(h => (
                                <HighlightCard key={h.id} highlight={h} onPlay={setActiveVideo} />
                            ))}
                        </div>
                    ) : (
                        <div className="hpage__empty">
                            <div className="hpage__empty-icon">⚽</div>
                            <h3>No highlights found</h3>
                            <p>Try a different league or search term.</p>
                            <button className="btn btn-outline" onClick={() => { setActiveLeague('All'); setQuery('') }}>
                                Clear Filters
                            </button>
                        </div>
                    )}
                </div>
            </section>

            <VideoModal highlight={activeVideo} onClose={() => setActiveVideo(null)} />
        </div>
    )
}
