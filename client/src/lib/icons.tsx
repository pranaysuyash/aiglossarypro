/**
 * Centralized Icon Library
 * 
 * This file consolidates all lucide-react icon imports to enable better tree-shaking
 * and reduce bundle size. Import icons from this file instead of directly from lucide-react.
 * 
 * Benefits:
 * - Better tree-shaking (only used icons are bundled)
 * - Consistent icon imports across the application  
 * - Easy icon replacement/theming
 * - Bundle size optimization
 */

// All Icons - Consolidated Export
export {
  // Core UI Icons
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Check,
  CheckCircle,
  X,
  XCircle,
  Plus,
  Menu,
  MoreHorizontal,
  MoreVertical,
  Search,
  Settings,
  Home,
  User,
  Users,
  Bell,
  Info,
  HelpCircle,
  ExternalLink,
  Link,
  Copy,
  Share,
  Share2,
  Download,
  Upload,
  Edit,
  Edit3,
  Trash2,
  Save,
  Loader2,
  RefreshCw,
  Calendar,
  Clock,
  Star,
  Heart,
  BookOpen,
  Book,
  Bookmark,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Globe,
  Shield,
  ShieldAlert,
  Target,
  Trophy,
  Zap,
  Sparkles,
  Gift,
  Crown,
  Circle,
  Square,
  Dot,
  
  // Navigation Icons
  PanelLeft,
  Sidebar as SidebarIcon,
  Grid3x3,
  List,
  Layers,
  Route,
  Network,
  
  // Content Icons
  FileText,
  FileSpreadsheet,
  Folder,
  FolderOpen,
  Code,
  Quote,
  Bold,
  Italic,
  Underline,
  Link as LinkIcon,
  
  // Media Icons
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Mic,
  
  // Analytics & Charts
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Database,
  Cpu,
  Brain,
  TestTube,
  Flag,
  
  // Status & Alerts
  AlertCircle,
  AlertTriangle,
  CheckCircle as SuccessIcon,
  XCircle as ErrorIcon,
  Info as InfoIcon,
  Wifi,
  WifiOff,
  CloudOff,
  
  // User Actions
  UserCheck,
  UserPlus,
  MessageCircle,
  MessageSquare,
  Filter,
  SortAsc,
  SortDesc,
  SlidersHorizontal,
  GripVertical
} from 'lucide-react';

// Additional Icons - Not already exported above
export {
  // Navigation & Layout
  Maximize,
  Maximize2,
  Minimize,
  Minimize2,
  Repeat,
  RotateCcw,
  
  // Social & External
  Facebook,
  Twitter,
  Linkedin,
  Github,
  Share as ShareIcon,
  
  // Business & Commerce
  CreditCard,
  Gift as GiftIcon,
  DollarSign as DollarSignIcon,
  Smartphone as SmartphoneIcon,
  
  // Development & Tools  
  GitBranch,
  Cookie,
  Wand2,
  Lightbulb,
  History,
  
  // Additional missing icons
  Bot
} from 'lucide-react';

// Icon type for consistent usage
export type IconComponent = React.ComponentType<{
  className?: string;
  size?: number | string;
  strokeWidth?: number;
}>;

// Icon size constants
export const ICON_SIZES = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  '2xl': 48,
} as const;

// Common icon class combinations
export const ICON_CLASSES = {
  primary: 'text-blue-500',
  secondary: 'text-gray-500',
  success: 'text-green-500',
  warning: 'text-yellow-500',
  error: 'text-red-500',
  muted: 'text-gray-400',
  interactive: 'text-gray-600 hover:text-gray-900 transition-colors',
} as const;

/**
 * Creates a standardized icon component with consistent sizing and styling
 */
export function createIcon(
  IconComponent: IconComponent,
  defaultProps?: Partial<React.ComponentProps<IconComponent>>
) {
  return function StyledIcon(props: React.ComponentProps<IconComponent>) {
    return <IconComponent {...defaultProps} {...props} />;
  };
}

/**
 * Helper function to get icon size value
 */
export function getIconSize(size: keyof typeof ICON_SIZES): number {
  return ICON_SIZES[size];
}

/**
 * Helper function to get icon class names
 */
export function getIconClasses(variant: keyof typeof ICON_CLASSES, additionalClasses?: string): string {
  return `${ICON_CLASSES[variant]} ${additionalClasses || ''}`.trim();
}