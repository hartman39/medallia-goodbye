import React, { useState, useCallback, useEffect } from 'react';
import { Connection, CSVParser } from './utils/csvParser';
import { StorageManager } from './utils/storage';
import { ProductionDataManager } from './utils/productionData';
import Timeline from './components/Timeline/Timeline';
import ConstellationMap from './components/ConstellationMap/ConstellationMap';
import WhereAreTheyNow from './components/WhereAreTheyNow/WhereAreTheyNow';
import PhotoGallery from './components/PhotoGallery/PhotoGallery';
import ReviewConnections from './components/ReviewConnections/ReviewConnections';
import ManageConnections from './components/ManageConnections/ManageConnections';
import MessageBoard from './components/MessageBoard/MessageBoard';
import './App.css';

type ViewMode = 'upload' | 'timeline' | 'wherearettheynow' | 'gallery' | 'thankyou' | 'customers' | 'messages' | 'review' | 'manage';

function App() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [allConnections, setAllConnections] = useState<Connection[]>([]);
  const [currentView, setCurrentView] = useState<ViewMode>('upload');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Load data on app start - production data takes priority
  useEffect(() => {
    if (ProductionDataManager.isProductionMode()) {
      // Production mode: use built-in data
      const productionConnections = ProductionDataManager.getProductionConnections();
      setConnections(productionConnections);
      setAllConnections(productionConnections);
      setCurrentView('timeline'); // Start with timeline in production
    } else {
      // Development mode: try to load from localStorage
      const storedData = StorageManager.loadData();
      if (storedData) {
        setConnections(storedData.medalliaConnections);
        setAllConnections(storedData.allConnections);
        setCurrentView('review'); // Start on review screen if we have data
      }
    }
  }, []);

  const handleFileSelection = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setSelectedFile(file || null);
  }, []);

  const handleFileUpload = useCallback(async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    try {
      const content = await selectedFile.text();
      const { medalliaConnections, allConnections: allConns } = CSVParser.parseCSV(content);
      setConnections(medalliaConnections);
      setAllConnections(allConns);
      setCurrentView('review');
    } catch (error) {
      console.error('Error parsing CSV:', error);
      alert('Error parsing CSV file. Please check the format.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedFile]);

  const handleUpdateConnections = useCallback((updatedConnections: Connection[]) => {
    setAllConnections(updatedConnections);
    const medalliaConnections = updatedConnections.filter(c => c.isMedallia);
    setConnections(medalliaConnections);

    // Save to localStorage whenever connections are updated
    const manuallyAddedIds = StorageManager.getManuallyAddedIds();
    StorageManager.saveData(updatedConnections, medalliaConnections, manuallyAddedIds);
  }, []);

  const renderNavigation = () => {
    if (currentView === 'upload') return null;

    const isProduction = ProductionDataManager.isProductionMode();

    const navItems = [
      // Only show review and manage in development mode
      ...(!isProduction ? [
        { key: 'review', label: '🔍 Review', description: 'Add missed connections' },
        { key: 'manage', label: '⚙️ Manage', description: 'Remove incorrect connections' }
      ] : []),
      { key: 'thankyou', label: '💙 Thank You', description: 'Gratitude messages' },
      { key: 'gallery', label: '📸 Gallery', description: 'Photo memories' },
      { key: 'timeline', label: '📅 Timeline', description: 'Your journey through time' },
      { key: 'wherearettheynow', label: '🏢 Where Are They Now', description: 'Top companies alumni joined' },
      { key: 'customers', label: '🤝 Thank You Customers', description: 'Gratitude to our amazing customers' },
      { key: 'messages', label: '💬 Messages', description: 'Leave farewell messages' }
    ];

    return (
      <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between items-center py-3 sm:py-0 sm:h-16">
            <div className="flex items-center mb-3 sm:mb-0">
              <h1 className="text-xl sm:text-2xl font-bold text-medallia-purple">Thank you, Medallia</h1>
            </div>
            <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
              {navItems.map(item => (
                <button
                  key={item.key}
                  onClick={() => setCurrentView(item.key as ViewMode)}
                  className={`px-2 sm:px-3 py-1 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                    currentView === item.key
                      ? 'bg-medallia-purple text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  title={item.description}
                >
                  <span className="hidden sm:inline">{item.label}</span>
                  <span className="sm:hidden">
                    {item.key === 'thankyou' ? '💙' :
                     item.key === 'gallery' ? '📸' :
                     item.key === 'timeline' ? '📅' :
                     item.key === 'wherearettheynow' ? '🏢' :
                     item.key === 'customers' ? '🤝' :
                     item.key === 'messages' ? '💬' :
                     item.key === 'review' ? '🔍' :
                     item.key === 'manage' ? '⚙️' : item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>
    );
  };

  const renderContent = () => {
    switch (currentView) {
      case 'review':
        return (
          <ReviewConnections
            allConnections={allConnections}
            medalliaConnections={connections}
            onUpdateConnections={handleUpdateConnections}
          />
        );

      case 'manage':
        return (
          <ManageConnections
            connections={connections}
            onUpdateConnections={(updatedConnections) => {
              setConnections(updatedConnections);
              // Update allConnections to remove the same connections
              const updatedIds = new Set(updatedConnections.map(c => c.id));
              const updatedAllConnections = allConnections.map(c =>
                updatedIds.has(c.id) ? c : { ...c, isMedallia: false }
              );
              setAllConnections(updatedAllConnections);

              // Save to localStorage
              const manuallyAddedIds = StorageManager.getManuallyAddedIds();
              StorageManager.saveData(updatedAllConnections, updatedConnections, manuallyAddedIds);
            }}
          />
        );

      case 'upload':
        const dataSummary = StorageManager.getDataSummary();
        return (
          <div className="min-h-screen bg-gradient-to-br from-medallia-purple to-medallia-blue flex items-center justify-center">
            <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Thank you, Medallia</h1>
                <p className="text-gray-600">A heartfelt goodbye note for my amazing colleagues</p>
              </div>

              {dataSummary && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Previous Data Found</h3>
                  <p className="text-sm text-green-700">
                    {dataSummary.count} connections saved from {new Date(dataSummary.lastUpdated).toLocaleDateString()}
                  </p>
                  <button
                    onClick={() => {
                      const storedData = StorageManager.loadData();
                      if (storedData) {
                        setConnections(storedData.medalliaConnections);
                        setAllConnections(storedData.allConnections);
                        setCurrentView('review');
                      }
                    }}
                    className="mt-2 text-sm text-green-800 hover:text-green-900 underline"
                  >
                    Continue with previous data
                  </button>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload LinkedIn Connections CSV
                  </label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelection}
                    disabled={isLoading}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-medallia-purple file:text-white hover:file:bg-medallia-darkPurple disabled:opacity-50"
                  />
                  {selectedFile && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 mb-3">
                        Selected: {selectedFile.name}
                      </p>
                      <button
                        onClick={handleFileUpload}
                        disabled={isLoading}
                        className="w-full bg-medallia-purple text-white py-2 px-4 rounded-lg font-medium hover:bg-medallia-darkPurple disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? 'Processing...' : 'Process Connections'}
                      </button>
                    </div>
                  )}
                </div>

                {isLoading && (
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-medallia-purple"></div>
                    <p className="mt-2 text-sm text-gray-600">Processing your connections...</p>
                  </div>
                )}

                <div className="text-xs text-gray-500 space-y-1">
                  <p>• Export your LinkedIn connections as CSV</p>
                  <p>• Only Medallia connections will be processed</p>
                  <p>• Your data stays private on your device</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'timeline':
        return <Timeline connections={connections} />;

      case 'wherearettheynow':
        return <WhereAreTheyNow connections={connections} />;

      case 'gallery':
        return <PhotoGallery />;

      case 'thankyou':
        return (
          <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center">
                <h1 className="text-5xl font-bold text-gray-900 mb-8">Thank You, Medallia!</h1>

                <div className="bg-white rounded-xl shadow-lg p-12 mb-8">
                  <div className="text-6xl mb-6">💙</div>

                  <div className="space-y-6 text-lg text-gray-700 leading-relaxed">
                    <p>
                      As I reflect on my incredible journey at Medallia, I'm filled with immense gratitude
                      for the amazing people, experiences, and growth that have shaped my time here.
                    </p>

                    <p>
                      From day one, Medallia has been more than just a workplace—it's been a community
                      of passionate individuals united by a shared mission to help companies deliver
                      exceptional customer experiences.
                    </p>

                    <p>
                      To my colleagues: Thank you for the countless collaborations, the innovative solutions
                      we've built together, and the friendships that will last long beyond these walls.
                      Your dedication, creativity, and support have made every challenge an opportunity to learn and grow.
                    </p>

                    <p>
                      To the founders: Thank you for creating an environment where ideas flourish,
                      where taking risks is encouraged, and where every voice is valued.
                    </p>

                    <p className="font-semibold text-purple-600">
                      While this chapter may be ending, the lessons learned, relationships built,
                      and memories created at Medallia will forever be treasured.
                    </p>

                    <p className="text-xl font-bold text-gray-900">
                      Thank you for an unforgettable journey. 🙏
                    </p>
                  </div>
                </div>

                <div className="text-gray-600 text-center">
                  <p className="italic">With heartfelt appreciation and best wishes for the future</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'customers':
        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 sm:mb-8">Thank You, Our Amazing Customers!</h1>

                <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 mb-8 sm:mb-12">
                  <div className="text-6xl mb-6">🤝</div>

                  <div className="space-y-4 sm:space-y-6 text-base sm:text-lg text-gray-700 leading-relaxed max-w-4xl mx-auto">
                    <p>
                      Throughout my journey at Medallia, I've had the incredible privilege of working alongside
                      some of the world's most innovative and customer-focused organizations. Your trust in our
                      platform and dedication to improving customer experiences has been truly inspiring.
                    </p>

                    <p>
                      Your feedback, partnership, and commitment
                      to putting your customers first has not only shaped Medallia's products but has transformed
                      entire industries.
                    </p>

                    <p className="font-semibold text-blue-600">
                      Thank you for believing in the power of customer experience and for allowing us to be
                      part of your journey toward creating exceptional customer moments.
                    </p>
                  </div>
                </div>

                {/* Customer Logos Grid */}
                <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 lg:p-12">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">
                    Proud to Have Served Industry Leaders
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
                    {/* Financial Services */}
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold text-blue-600 mb-4 sm:mb-6 border-b-2 border-blue-600 pb-2">
                        Financial Services
                      </h3>
                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 rounded-lg hover:bg-gray-50">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-600 rounded flex items-center justify-center">
                            <span className="text-white font-bold text-sm">V</span>
                          </div>
                          <span className="text-sm sm:text-lg font-medium">Vanguard</span>
                        </div>
                        <div className="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 rounded-lg hover:bg-gray-50">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded flex items-center justify-center">
                            <span className="text-white font-bold text-xs">ML</span>
                          </div>
                          <span className="text-sm sm:text-lg font-medium">MetLife</span>
                        </div>
                        <div className="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 rounded-lg hover:bg-gray-50">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-500 rounded flex items-center justify-center">
                            <span className="text-white font-bold text-xs">SF</span>
                          </div>
                          <span className="text-sm sm:text-lg font-medium">State Farm</span>
                        </div>
                      </div>
                    </div>

                    {/* Hospitality */}
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold text-blue-600 mb-4 sm:mb-6 border-b-2 border-blue-600 pb-2">
                        Hospitality
                      </h3>
                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 rounded-lg hover:bg-gray-50">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-600 rounded flex items-center justify-center">
                            <span className="text-white font-bold text-xs">M</span>
                          </div>
                          <span className="text-sm sm:text-lg font-medium">Marriott</span>
                        </div>
                        <div className="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 rounded-lg hover:bg-gray-50">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-700 rounded flex items-center justify-center">
                            <span className="text-white font-bold text-xs">H</span>
                          </div>
                          <span className="text-sm sm:text-lg font-medium">Hilton</span>
                        </div>
                        <div className="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 rounded-lg hover:bg-gray-50">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-700 rounded flex items-center justify-center">
                            <span className="text-white font-bold text-xs">J</span>
                          </div>
                          <span className="text-sm sm:text-lg font-medium">Jumeirah</span>
                        </div>
                      </div>
                    </div>

                    {/* Retail */}
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold text-blue-600 mb-4 sm:mb-6 border-b-2 border-blue-600 pb-2">
                        Retail
                      </h3>
                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 rounded-lg hover:bg-gray-50">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-500 rounded flex items-center justify-center">
                            <span className="text-white font-bold text-xs">★</span>
                          </div>
                          <span className="text-sm sm:text-lg font-medium">Walmart</span>
                        </div>
                        <div className="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 rounded-lg hover:bg-gray-50">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded flex items-center justify-center">
                            <span className="text-white font-bold text-xs">SC</span>
                          </div>
                          <span className="text-sm sm:text-lg font-medium">Sam's Club</span>
                        </div>
                        <div className="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 rounded-lg hover:bg-gray-50">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-500 rounded flex items-center justify-center">
                            <span className="text-white font-bold text-xs">W</span>
                          </div>
                          <span className="text-sm sm:text-lg font-medium">Walgreens</span>
                        </div>
                      </div>
                    </div>

                    {/* Technology & Enterprise */}
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold text-blue-600 mb-4 sm:mb-6 border-b-2 border-blue-600 pb-2">
                        Technology & Enterprise
                      </h3>
                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 rounded-lg hover:bg-gray-50">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded flex items-center justify-center">
                            <span className="text-white font-bold text-xs">SAP</span>
                          </div>
                          <span className="text-sm sm:text-lg font-medium">SAP</span>
                        </div>
                        <div className="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 rounded-lg hover:bg-gray-50">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-700 rounded flex items-center justify-center">
                            <span className="text-white font-bold text-xs">C</span>
                          </div>
                          <span className="text-sm sm:text-lg font-medium">Comcast</span>
                        </div>
                        <div className="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 rounded-lg hover:bg-gray-50">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-600 rounded flex items-center justify-center">
                            <span className="text-white font-bold text-xs">AS</span>
                          </div>
                          <span className="text-sm sm:text-lg font-medium">ASDA</span>
                        </div>
                      </div>
                    </div>

                    {/* Healthcare & Services */}
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold text-blue-600 mb-4 sm:mb-6 border-b-2 border-blue-600 pb-2">
                        Healthcare & Services
                      </h3>
                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 rounded-lg hover:bg-gray-50">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded flex items-center justify-center">
                            <span className="text-white font-bold text-xs">H</span>
                          </div>
                          <span className="text-sm sm:text-lg font-medium">Highmark</span>
                        </div>
                        <div className="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 rounded-lg hover:bg-gray-50">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-600 rounded flex items-center justify-center">
                            <span className="text-white font-bold text-xs">A</span>
                          </div>
                          <span className="text-sm sm:text-lg font-medium">Aramark</span>
                        </div>
                      </div>
                    </div>

                    {/* Automotive */}
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold text-blue-600 mb-4 sm:mb-6 border-b-2 border-blue-600 pb-2">
                        Automotive
                      </h3>
                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 rounded-lg hover:bg-gray-50">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-black rounded flex items-center justify-center">
                            <span className="text-white font-bold text-xs">A</span>
                          </div>
                          <span className="text-sm sm:text-lg font-medium">Audi</span>
                        </div>
                        <div className="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 rounded-lg hover:bg-gray-50">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-700 rounded flex items-center justify-center">
                            <span className="text-white font-bold text-xs">N</span>
                          </div>
                          <span className="text-sm sm:text-lg font-medium">Nissan</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 text-gray-600 text-center">
                  <p className="italic text-lg">
                    "Your success is our success. Thank you for trusting us to help you create exceptional customer experiences."
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'messages':
        return (
          <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
            <div className="max-w-4xl mx-auto">
              <MessageBoard />
            </div>
          </div>
        );


      default:
        return null;
    }
  };

  return (
    <div className="App">
      {renderNavigation()}
      {renderContent()}

      {/* Footer */}
      {currentView !== 'upload' && (
        <footer className="bg-gray-50 border-t border-gray-200 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center text-sm text-gray-500">
              Built with{' '}
              <a
                href="https://claude.com/product/claude-code"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:text-purple-700 underline"
              >
                Claude Code
              </a>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

export default App;
