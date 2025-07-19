import React, { createContext, useContext, useMemo, useReducer } from 'react';

// Define the application state shape
interface AppState {
    isLoading: boolean;
    error: string | null;
    notifications: Notification[];
    preferences: UserPreferences;
    ui: UIState;
}

interface Notification {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    timestamp: number;
    autoClose?: boolean;
}

interface UserPreferences {
    theme: 'light' | 'dark' | 'system';
    language: string;
    accessibility: {
        reducedMotion: boolean;
        highContrast: boolean;
        fontSize: 'small' | 'medium' | 'large';
    };
}

interface UIState {
    sidebarOpen: boolean;
    mobileMenuOpen: boolean;
    searchOpen: boolean;
    currentPage: string;
}

// Define action types
type AppAction =
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'ADD_NOTIFICATION'; payload: Omit<Notification, 'id' | 'timestamp'> }
    | { type: 'REMOVE_NOTIFICATION'; payload: string }
    | { type: 'UPDATE_PREFERENCES'; payload: Partial<UserPreferences> }
    | { type: 'TOGGLE_SIDEBAR' }
    | { type: 'TOGGLE_MOBILE_MENU' }
    | { type: 'TOGGLE_SEARCH' }
    | { type: 'SET_CURRENT_PAGE'; payload: string }
    | { type: 'RESET_UI_STATE' };

// Initial state
const initialState: AppState = {
    isLoading: false,
    error: null,
    notifications: [],
    preferences: {
        theme: 'system',
        language: 'en',
        accessibility: {
            reducedMotion: false,
            highContrast: false,
            fontSize: 'medium',
        },
    },
    ui: {
        sidebarOpen: false,
        mobileMenuOpen: false,
        searchOpen: false,
        currentPage: '/',
    },
};

// Reducer function
function appStateReducer(state: AppState, action: AppAction): AppState {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };

        case 'SET_ERROR':
            return { ...state, error: action.payload };

        case 'ADD_NOTIFICATION':
            return {
                ...state,
                notifications: [
                    ...state.notifications,
                    {
                        ...action.payload,
                        id: Date.now().toString(),
                        timestamp: Date.now(),
                    },
                ],
            };

        case 'REMOVE_NOTIFICATION':
            return {
                ...state,
                notifications: state.notifications.filter(n => n.id !== action.payload),
            };

        case 'UPDATE_PREFERENCES':
            return {
                ...state,
                preferences: { ...state.preferences, ...action.payload },
            };

        case 'TOGGLE_SIDEBAR':
            return {
                ...state,
                ui: { ...state.ui, sidebarOpen: !state.ui.sidebarOpen },
            };

        case 'TOGGLE_MOBILE_MENU':
            return {
                ...state,
                ui: { ...state.ui, mobileMenuOpen: !state.ui.mobileMenuOpen },
            };

        case 'TOGGLE_SEARCH':
            return {
                ...state,
                ui: { ...state.ui, searchOpen: !state.ui.searchOpen },
            };

        case 'SET_CURRENT_PAGE':
            return {
                ...state,
                ui: { ...state.ui, currentPage: action.payload },
            };

        case 'RESET_UI_STATE':
            return {
                ...state,
                ui: {
                    sidebarOpen: false,
                    mobileMenuOpen: false,
                    searchOpen: false,
                    currentPage: state.ui.currentPage,
                },
            };

        default:
            return state;
    }
}

// Context type
interface AppStateContextType {
    state: AppState;
    dispatch: React.Dispatch<AppAction>;
    // Memoized action creators
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
    removeNotification: (id: string) => void;
    updatePreferences: (preferences: Partial<UserPreferences>) => void;
    toggleSidebar: () => void;
    toggleMobileMenu: () => void;
    toggleSearch: () => void;
    setCurrentPage: (page: string) => void;
    resetUIState: () => void;
}

// Create context
const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

// Provider component
export function AppStateProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(appStateReducer, initialState);

    // Memoized action creators to prevent unnecessary re-renders
    const actions = useMemo(() => ({
        setLoading: (loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading }),
        setError: (error: string | null) => dispatch({ type: 'SET_ERROR', payload: error }),
        addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) =>
            dispatch({ type: 'ADD_NOTIFICATION', payload: notification }),
        removeNotification: (id: string) => dispatch({ type: 'REMOVE_NOTIFICATION', payload: id }),
        updatePreferences: (preferences: Partial<UserPreferences>) =>
            dispatch({ type: 'UPDATE_PREFERENCES', payload: preferences }),
        toggleSidebar: () => dispatch({ type: 'TOGGLE_SIDEBAR' }),
        toggleMobileMenu: () => dispatch({ type: 'TOGGLE_MOBILE_MENU' }),
        toggleSearch: () => dispatch({ type: 'TOGGLE_SEARCH' }),
        setCurrentPage: (page: string) => dispatch({ type: 'SET_CURRENT_PAGE', payload: page }),
        resetUIState: () => dispatch({ type: 'RESET_UI_STATE' }),
    }), []);

    // Memoize the context value to prevent unnecessary re-renders
    const contextValue = useMemo(() => ({
        state,
        dispatch,
        ...actions,
    }), [state, actions]);

    return (
        <AppStateContext.Provider value={contextValue}>
            {children}
        </AppStateContext.Provider>
    );
}

// Custom hook to use the app state
export function useAppState() {
    const context = useContext(AppStateContext);
    if (context === undefined) {
        throw new Error('useAppState must be used within an AppStateProvider');
    }
    return context;
}

// Selector hooks for specific parts of state to minimize re-renders
export function useAppLoading() {
    const { state } = useAppState();
    return state.isLoading;
}

export function useAppError() {
    const { state } = useAppState();
    return state.error;
}

export function useNotifications() {
    const { state, addNotification, removeNotification } = useAppState();
    return {
        notifications: state.notifications,
        addNotification,
        removeNotification,
    };
}

export function useUserPreferences() {
    const { state, updatePreferences } = useAppState();
    return {
        preferences: state.preferences,
        updatePreferences,
    };
}

export function useUIState() {
    const { state, toggleSidebar, toggleMobileMenu, toggleSearch, setCurrentPage, resetUIState } = useAppState();
    return {
        ui: state.ui,
        toggleSidebar,
        toggleMobileMenu,
        toggleSearch,
        setCurrentPage,
        resetUIState,
    };
}