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
// Additional Icons - Not already exported above
export {
  Activity,
  // Status & Alerts
  AlertCircle,
  AlertTriangle,
  // Core UI Icons
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  // Analytics & Charts
  Award,
  BarChart3,
  Bell,
  Bold,
  Book,
  Bookmark,
  BookOpen,
  // Additional missing icons
  Bot,
  Brain,
  Briefcase,
  Calendar,
  Check,
  CheckCircle,
  CheckCircle as SuccessIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Circle,
  Clock,
  CloudOff,
  Code,
  Cookie,
  Copy,
  Cpu,
  // Business & Commerce
  CreditCard,
  Crown,
  Database,
  DollarSign as DollarSignIcon,
  Dot,
  Download,
  Edit,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  // Social & External
  Facebook,
  FileSpreadsheet,
  // Content Icons
  FileText,
  Filter,
  Flag,
  Folder,
  FolderOpen,
  Gift,
  Gift as GiftIcon,
  // Development & Tools
  GitBranch,
  Github,
  Globe,
  Grid3x3,
  GripVertical,
  Heart,
  HelpCircle,
  History,
  Home,
  Image,
  Info,
  Info as InfoIcon,
  Italic,
  Layers,
  Lightbulb,
  Link,
  Link as LinkIcon,
  Linkedin,
  List,
  Loader2,
  Lock,
  Mail,
  // Navigation & Layout
  Maximize,
  Maximize2,
  Menu,
  MessageCircle,
  MessageSquare,
  Mic,
  Minimize,
  Minimize2,
  MoreHorizontal,
  MoreVertical,
  Network,
  // Navigation Icons
  Package,
  PanelLeft,
  Pause,
  // Media Icons
  Play,
  Plus,
  Quote,
  RefreshCw,
  Repeat,
  RotateCcw,
  Route,
  Save,
  Search,
  Settings,
  Share,
  Share as ShareIcon,
  Share2,
  Shield,
  ShieldAlert,
  Sidebar as SidebarIcon,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  Smartphone as SmartphoneIcon,
  SortAsc,
  SortDesc,
  Sparkles,
  Square,
  Star,
  Target,
  Terminal,
  TestTube,
  Trash2,
  TrendingDown,
  TrendingUp,
  Trophy,
  Twitter,
  Underline,
  Upload,
  User,
  // User Actions
  UserCheck,
  UserPlus,
  Users,
  Volume2,
  VolumeX,
  Wand2,
  Wifi,
  WifiOff,
  Wrench,
  Wrench as Tool,
  X,
  XCircle,
  XCircle as ErrorIcon,
  Zap,
} from 'lucide-react';

// Icon type for consistent usage
export type IconComponent = React.ComponentType<{
  className?: string | undefined;
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
export function getIconClasses(
  variant: keyof typeof ICON_CLASSES,
  additionalClasses?: string
): string {
  return `${ICON_CLASSES[variant]} ${additionalClasses || ''}`.trim();
}
