import useApi from '../api/client';

const SearchContext = createContext();

export const useSearchContext = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearchContext must be used within a SearchProvider');
  }
  return context;
};

export const SearchProvider = ({ children }) => {
  console.log('SearchProvider rendering...');
  const [results, setResults] = useState([]);
  const [watchlistResults, setWatchlistResults] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedConnector, setSelectedConnector] = useState('');

  const search = async (searchQuery = '', connector = '', setLoading, setIsSearching, setError) => {
    console.log('Search called with:', searchQuery, connector);
    try {
      setError(null); // Clear error
      let data = [];
      if (connector === '') {
        // Global: parallel calls to enabled connectors, merge unique by key, collect connectors per manga
        const connectorsRes = await useApi('/v2/MangaConnector');
        const enabled = connectorsRes.filter(c => c.enabled).map(c => c.name);
        const promises = enabled.map(conn =>
          useApi(`/v2/Search/${conn}/${encodeURIComponent(searchQuery)}`).then(items => {
            return (items || []).map(item => ({ ...item, sourceConnector: conn }));
          })
        );
        const allDataWithSource = await Promise.all(promises);
        const flatWithSource = allDataWithSource.flat();
        const mangaMap = new Map();
        flatWithSource.forEach(item => {
          if (!mangaMap.has(item.key)) {
            mangaMap.set(item.key, { ...item, availableConnectors: [] });
          }
          const manga = mangaMap.get(item.key);
          if (!manga.availableConnectors.includes(item.sourceConnector)) {
            manga.availableConnectors.push(item.sourceConnector);
          }
        });
        data = Array.from(mangaMap.values());
        console.log('Global merged results:', data);
      } else {
        // Single connector
        const responseData = await useApi(`/v2/Search/${connector}/${encodeURIComponent(searchQuery)}`);
        data = (responseData || []).map(d => ({ ...d, availableConnectors: [connector] }));
        console.log('Single connector results:', data);
      }
      setResults(data);
      setQuery(searchQuery);
      setSelectedConnector(connector);
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
      if (setError) setError(err.message || 'Search failed (404 or error)'); // Set error for page
    } finally {
      if (setLoading) setLoading(false);
      if (setIsSearching) setIsSearching(false); // Stop spinner
    }
  };

  const value = useMemo(() => ({
    results,
    setResults,
    watchlistResults,
    setWatchlistResults,
    search,
    query,
    setQuery,
    selectedConnector,
    setSelectedConnector
  }), [results, watchlistResults, query, selectedConnector]);

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};

export default SearchContext;