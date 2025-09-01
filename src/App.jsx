import React, { useState, useEffect } from "react";
import {
  Plus,
  Database,
  Key,
  Trash2,
  Copy,
  Check,
  Clock,
  Zap,
  BarChart3,
  TrendingUp,
  User,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Line,
  LineChart,
} from "recharts";
import { Tooltip, Zoom } from "@mui/material";
import CollectionModal from "./components/CollectionModal";
import CodeModal from "./components/CodeModal";
import CodeViewer from "./components/CodeViewer";
import AuthModal from "./components/AuthModal";
import {
  authService,
  codesService,
  analyticsService,
  useAuth,
} from "./firebase";

function App() {
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showCodeViewer, setShowCodeViewer] = useState(false);
  const [currentCode, setCurrentCode] = useState(null);
  const [alert, setAlert] = useState(null);

  // Authentication state using Firebase
  const { user: firebaseUser, loading: authLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Real data state for graphs and analytics
  const [historicalData, setHistoricalData] = useState([]);
  const [contributionData, setContributionData] = useState({});
  const [currentYearStats, setCurrentYearStats] = useState({
    totalCodes: 0,
    totalUsed: 0,
    totalAvailable: 0,
  });
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedCollections = localStorage.getItem("2fa-collections");
    if (savedCollections) {
      setCollections(JSON.parse(savedCollections));
    }
  }, []);

  // Update authentication state when Firebase user changes
  useEffect(() => {
    if (firebaseUser) {
      setIsAuthenticated(true);
      // Add a small delay to ensure user document is created
      setTimeout(() => {
        loadUserCodes();
        loadAnalyticsData();
      }, 1000);
    } else {
      setIsAuthenticated(false);
      // Clear analytics data when user logs out
      setHistoricalData([]);
      setContributionData({});
      setCurrentYearStats({ totalCodes: 0, totalUsed: 0, totalAvailable: 0 });
    }
  }, [firebaseUser]);

  // Save data to localStorage whenever collections change
  useEffect(() => {
    localStorage.setItem("2fa-collections", JSON.stringify(collections));
  }, [collections]);

  // Load analytics data from Firebase
  const loadAnalyticsData = async () => {
    if (!firebaseUser) return;

    setIsLoadingAnalytics(true);
    try {
      // Load current year statistics
      const stats = await analyticsService.getCurrentYearStats(
        firebaseUser.uid
      );
      setCurrentYearStats(stats);
      setHistoricalData(stats.monthlyData);

      // Load contribution data for the current year
      const contribData = await analyticsService.getContributionData(
        firebaseUser.uid,
        new Date().getFullYear()
      );
      setContributionData(contribData);
    } catch (error) {
      showAlert("Failed to load analytics data", "error");
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  // Refresh analytics data when collections change
  useEffect(() => {
    if (firebaseUser && collections.length > 0) {
      loadAnalyticsData();
    }
  }, [collections, firebaseUser]);

  // Function to refresh analytics data
  const refreshAnalytics = async () => {
    if (firebaseUser) {
      await loadAnalyticsData();
    }
  };

  // Contributions calendar by months (current year)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const currentYear = selectedYear;
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const monthsForCalendar = monthNames.map((name, index) => {
    const daysInMonth = new Date(currentYear, index + 1, 0).getDate();
    const firstDay = new Date(currentYear, index, 1).getDay(); // 0=Sun
    return { name, index, daysInMonth, firstDay };
  });
  // Get contribution intensity for a specific date
  const getContributionIntensity = (monthIndex, day) => {
    if (!contributionData || Object.keys(contributionData).length === 0) {
      return 0;
    }

    try {
      const date = new Date(currentYear, monthIndex, day + 1);
      const dateKey = date.toISOString().split("T")[0];
      return contributionData[dateKey] || 0;
    } catch (error) {
      return 0;
    }
  };

  // Handle year change for contribution calendar
  const handleYearChange = async (newYear) => {
    setSelectedYear(newYear);
    if (firebaseUser) {
      try {
        const contribData = await analyticsService.getContributionData(
          firebaseUser.uid,
          newYear
        );
        setContributionData(contribData);
      } catch (error) {}
    }
  };

  const createCollection = async (collectionName, description) => {
    if (!firebaseUser) {
      showAlert("Please sign in to create collections", "error");
      return;
    }

    try {
      const newCollection = {
        id: Date.now().toString(),
        name: collectionName,
        description: description,
        codes: [],
        createdAt: new Date().toISOString(),
      };

      setCollections([...collections, newCollection]);
      setShowCollectionModal(false);
      showAlert("Collection created successfully!", "success");
    } catch (error) {
      showAlert("Failed to create collection", "error");
    }
  };

  const deleteCollection = (collectionId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this collection and all its codes?"
      )
    ) {
      setCollections(collections.filter((c) => c.id !== collectionId));
      if (selectedCollection?.id === collectionId) {
        setSelectedCollection(null);
      }
      showAlert("Collection deleted successfully!", "success");
    }
  };

  const addCodes = async (collectionId, codes, label) => {
    if (!firebaseUser) {
      showAlert("Please sign in to add codes", "error");
      return;
    }

    try {
      const newCodes = codes.map((code) => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        code: code.trim(),
        label: label || "2FA Code",
        used: false,
        createdAt: new Date().toISOString(),
      }));

      // Save codes to Firebase without encryption
      const collection = collections.find((c) => c.id === collectionId);
      if (collection) {
        for (const codeData of newCodes) {
          await codesService.createCode({
            userId: firebaseUser.uid,
            code: codeData.code,
            description: codeData.label,
            collectionName: collection.name,
            collectionDescription: collection.description,
            isUsed: false,
          });
        }
      }

      setCollections(
        collections.map((collection) =>
          collection.id === collectionId
            ? { ...collection, codes: [...collection.codes, ...newCodes] }
            : collection
        )
      );

      setShowCodeModal(false);
      showAlert(`${newCodes.length} codes added successfully!`, "success");

      // Refresh analytics to update the graph
      refreshAnalytics();
    } catch (error) {
      showAlert("Failed to add codes to the cloud", "error");
    }
  };

  const useCode = async (collectionId, codeId) => {
    if (!firebaseUser) {
      showAlert("Please sign in to use codes", "error");
      return;
    }

    const collection = collections.find((c) => c.id === collectionId);
    const code = collection.codes.find((c) => c.id === codeId);

    if (code.used) {
      showAlert("This code has already been used!", "error");
      return;
    }

    try {
      // Mark code as used in Firebase without encryption
      await codesService.markCodeAsUsed(codeId);

      // Mark code as used locally
      setCollections(
        collections.map((c) =>
          c.id === collectionId
            ? {
                ...c,
                codes: c.codes.map((codeItem) =>
                  codeItem.id === codeId
                    ? {
                        ...codeItem,
                        used: true,
                        usedAt: new Date().toISOString(),
                      }
                    : codeItem
                ),
              }
            : c
        )
      );

      setCurrentCode(code);
      setShowCodeViewer(true);
      showAlert("Code marked as used!", "success");

      // Refresh analytics to update the graph
      refreshAnalytics();
    } catch (error) {
      showAlert("Failed to mark code as used", "error");
    }
  };

  const deleteUsedCodes = (collectionId) => {
    if (
      window.confirm(
        "Are you sure you want to delete all used codes from this collection?"
      )
    ) {
      setCollections(
        collections.map((collection) =>
          collection.id === collectionId
            ? {
                ...collection,
                codes: collection.codes.filter((code) => !code.used),
              }
            : collection
        )
      );
      showAlert("Used codes deleted successfully!", "success");
    }
  };

  const getUnusedCodeCount = (collection) => {
    return collection.codes.filter((code) => !code.used).length;
  };

  const getUsedCodeCount = (collection) => {
    return collection.codes.filter((code) => code.used).length;
  };

  const showAlert = (message, type) => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 3000);
  };

  // Load user codes from Firebase
  const loadUserCodes = async () => {
    if (!firebaseUser) return;

    try {
      const userCodes = await codesService.getUserCodes(firebaseUser.uid);

      // Convert Firebase data to local format
      const firebaseCollections = {};

      if (userCodes && userCodes.length > 0) {
        userCodes.forEach((code) => {
          if (!firebaseCollections[code.collectionName]) {
            firebaseCollections[code.collectionName] = {
              id: code.collectionName,
              name: code.collectionName,
              description: code.collectionDescription || "",
              codes: [],
              createdAt: code.createdAt || new Date().toISOString(),
            };
          }

          firebaseCollections[code.collectionName].codes.push({
            id: code.id,
            code: code.code,
            label: code.description || "2FA Code",
            used: code.isUsed,
            createdAt: code.createdAt || new Date().toISOString(),
          });
        });

        const collectionsArray = Object.values(firebaseCollections);
        setCollections(collectionsArray);
      } else {
        // No codes found, start with empty collections
        setCollections([]);
      }
    } catch (error) {
      // Check if it's a permission error
      if (error.message.includes("Permission denied")) {
        // For new users, just start with empty collections
        setCollections([]);
        showAlert(
          "Welcome! You can start creating your first 2FA codes.",
          "success"
        );
      } else {
        showAlert("Failed to load your codes from the cloud", "error");
      }
    }
  };

  // Authentication handlers
  const handleAuthSuccess = (authData) => {
    setShowAuthModal(false);
    showAlert(`Welcome back, ${authData.user.name}!`, "success");
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      setCollections([]);
      showAlert("Logged out successfully", "success");
    } catch (error) {
      showAlert("Logout failed", "error");
    }
  };

  const handleShowAuth = () => {
    setShowAuthModal(true);
  };

  // Show loading screen while authentication is being checked
  if (authLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner large"></div>
        <p>Loading your secure workspace...</p>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <div className="header-content">
          <h1>2FA Code Manager</h1>
          <p>
            Securely manage your two-factor authentication backup codes with
            intelligent organization and automatic cleanup.
          </p>
        </div>

        <div className="header-stats">
          <div className="stat-item">
            <Database size={20} />
            <span>{collections.length} Collections</span>
          </div>
          <div className="stat-item">
            <Key size={20} />
            <span>
              {collections.reduce((total, c) => total + c.codes.length, 0)}{" "}
              Total Codes
            </span>
          </div>
          <div className="stat-item">
            <Zap size={20} />
            <span>
              {collections.reduce(
                (total, c) =>
                  total + c.codes.filter((code) => !code.used).length,
                0
              )}{" "}
              Available
            </span>
          </div>
          {isAuthenticated && firebaseUser ? (
            <div className="stat-item user-info">
              <User size={20} />
              <span>{firebaseUser.displayName || firebaseUser.email}</span>
              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : (
            <div className="stat-item">
              <button
                className="btn btn-primary btn-sm"
                onClick={handleShowAuth}
              >
                <User size={16} />
                Sign In
              </button>
            </div>
          )}
        </div>
      </div>

      {alert && (
        <div className="toast-container">
          <div className={`toast toast-${alert.type}`}>{alert.message}</div>
        </div>
      )}

      {/* Main Layout - Graph on Left, Content on Right */}
      <div className="main-layout">
        {/* Left Side - Historical Usage Graph */}
        <div className="left-panel">
          {/* Contributions Calendar (monthly layout) */}
          <div className="contrib-calendar">
            <div className="contrib-header">
              <select
                className="year-filter-dropdown"
                value={selectedYear}
                onChange={(e) => handleYearChange(parseInt(e.target.value))}
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - 2 + i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="contrib-months">
              {monthsForCalendar.map((m) => (
                <div className="contrib-month" key={m.index}>
                  <div className="contrib-month-name">{m.name}</div>
                  <div
                    className="contrib-month-grid"
                    style={{ gridTemplateColumns: "repeat(7, 1fr)" }}
                  >
                    {Array.from({ length: m.firstDay }).map((_, i) => (
                      <div key={`empty-${i}`} className="contrib-cell empty" />
                    ))}
                    {Array.from({ length: m.daysInMonth }).map((_, day) => {
                      const intensity = getContributionIntensity(m.index, day);
                      return (
                        <Tooltip
                          key={day}
                          title={`${m.name} ${
                            day + 1
                          }, ${currentYear}: ${intensity} codes created`}
                          TransitionComponent={Zoom}
                          arrow
                          placement="top"
                          sx={{
                            "& .MuiTooltip-tooltip": {
                              backgroundColor: "#1e1e2e",
                              color: "#e0e0e0",
                              fontSize: "12px",
                              padding: "8px 12px",
                              borderRadius: "8px",
                              border: "1px solid rgba(255,255,255,0.1)",
                              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                            },
                            "& .MuiTooltip-arrow": {
                              color: "#1e1e2e",
                            },
                          }}
                        >
                          <div className={`contrib-cell level-${intensity}`} />
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="card graph-card">
            <div className="card-header">
              <h2 className="card-title">
                <TrendingUp size={20} />
                Historical Code Usage
              </h2>
              <p className="card-subtitle">Last 12 months</p>
            </div>

            {isLoadingAnalytics ? (
              <div className="line-graph-container">
                <div className="loading-spinner large"></div>
                <p>Loading analytics...</p>
              </div>
            ) : (
              <>
                <div className="line-graph-container">
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={historicalData}>
                      <defs>
                        <linearGradient
                          id="usedGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#667eea"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#667eea"
                            stopOpacity={0.1}
                          />
                        </linearGradient>
                        <linearGradient
                          id="totalGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#6366f1"
                            stopOpacity={0.2}
                          />
                          <stop
                            offset="95%"
                            stopColor="#6366f1"
                            stopOpacity={0.05}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.1)"
                        horizontal={true}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: "#a0a0a0" }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: "#a0a0a0" }}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: "#1e1e2e",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "8px",
                          fontSize: "12px",
                          color: "#e0e0e0",
                        }}
                        labelStyle={{ color: "#ffffff" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="total"
                        stackId="1"
                        stroke="#6366f1"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        fill="url(#totalGradient)"
                        fillOpacity={0.4}
                      />
                      <Area
                        type="monotone"
                        dataKey="used"
                        stackId="2"
                        stroke="#667eea"
                        strokeWidth={2}
                        fill="url(#usedGradient)"
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="graph-legend">
                  <div className="legend-item">
                    <div className="legend-color legend-used"></div>
                    <span>Used Codes</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color legend-total"></div>
                    <span>Total Codes</span>
                  </div>
                </div>

                <div className="graph-stats">
                  <div className="stat-item-small">
                    <Database size={14} />
                    <span>{currentYearStats.totalCodes} Total</span>
                  </div>
                  <div className="stat-item-small">
                    <Check size={14} />
                    <span>{currentYearStats.totalUsed} Used</span>
                  </div>
                  <div className="stat-item-small">
                    <Key size={14} />
                    <span>{currentYearStats.totalAvailable} Available</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Side - Main Content */}
        <div className="right-panel">
          {/* Collections Section */}
          <div className="card compact">
            <div className="card-header">
              <h3 className="card-title">Collections</h3>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowCollectionModal(true)}
              >
                <Plus size={14} />
                New
              </button>
            </div>

            {collections.length === 0 ? (
              <div className="empty-state compact">
                <Database size={32} />
                <p>No collections yet</p>
              </div>
            ) : (
              <div className="collection-list">
                {collections.map((collection) => (
                  <div
                    key={collection.id}
                    className={`collection-item compact ${
                      selectedCollection?.id === collection.id ? "selected" : ""
                    }`}
                    onClick={() => setSelectedCollection(collection)}
                  >
                    <div className="collection-info">
                      <h4 className="collection-name">{collection.name}</h4>
                      <span className="collection-count">
                        {getUnusedCodeCount(collection)} available
                      </span>
                    </div>
                    <div className="collection-actions">
                      <button
                        className="btn btn-secondary btn-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCollection(collection);
                        }}
                      >
                        <Key size={12} />
                      </button>
                      <button
                        className="btn btn-danger btn-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCollection(collection.id);
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Collection Codes */}
          {selectedCollection && (
            <div className="card compact">
              <div className="card-header">
                <h3 className="card-title">
                  Codes in "{selectedCollection.name}"
                </h3>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowCodeModal(true)}
                >
                  <Plus size={14} />
                  Add
                </button>
              </div>

              {selectedCollection.codes.length === 0 ? (
                <div className="empty-state compact">
                  <Key size={32} />
                  <p>No codes yet</p>
                </div>
              ) : (
                <div className="code-list">
                  {selectedCollection.codes.map((code) => (
                    <div
                      key={code.id}
                      className={`code-item compact ${code.used ? "used" : ""}`}
                      onClick={() =>
                        !code.used && useCode(selectedCollection.id, code.id)
                      }
                    >
                      <div className="code-text">{code.code}</div>
                      {code.used && (
                        <div className="used-badge">
                          <Check size={12} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCollectionModal && (
        <CollectionModal
          onClose={() => setShowCollectionModal(false)}
          onSubmit={createCollection}
        />
      )}

      {showCodeModal && selectedCollection && (
        <CodeModal
          onClose={() => setShowCodeModal(false)}
          onSubmit={(codes, label) =>
            addCodes(selectedCollection.id, codes, label)
          }
          collectionName={selectedCollection.name}
        />
      )}

      {showCodeViewer && currentCode && (
        <CodeViewer
          code={currentCode}
          onClose={() => setShowCodeViewer(false)}
        />
      )}

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}

export default App;
