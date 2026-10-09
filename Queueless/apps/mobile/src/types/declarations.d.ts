declare const __DEV__: boolean;

declare const process: {
  env: {
    EXPO_PUBLIC_API_URL?: string;
    [key: string]: string | undefined;
  };
};

declare const require: any;

declare function describe(name: string, fn: () => void): void;
declare function it(name: string, fn: () => void | Promise<void>): void;
declare function test(name: string, fn: () => void | Promise<void>): void;
declare function expect(actual: any): any;
declare function beforeEach(fn: () => void | Promise<void>): void;
declare function afterEach(fn: () => void | Promise<void>): void;

declare module 'react' {
  export const useState: <T>(initial: T | (() => T)) => [T, (val: T | ((prev: T) => T)) => void];
  export const useEffect: (effect: () => void | (() => void), deps?: readonly any[]) => void;
  export const useCallback: <T extends (...args: any[]) => any>(callback: T, deps: readonly any[]) => T;
  export const useMemo: <T>(factory: () => T, deps: readonly any[]) => T;
  export const useRef: <T>(initial?: T) => { current: T };
  export const createContext: <T>(defaultValue: T) => any;
  export const useContext: <T>(context: any) => T;
  export type ReactNode = any;
  export type FC<P = {}> = (props: P) => any;
  export type ComponentType<P = {}> = any;
  export class Component<P = {}, S = {}> {
    props: P;
    state: S;
    setState(state: any): void;
    render(): any;
  }
  const React: any;
  export default React;
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
  interface Element extends React.ReactNode {}
}

declare module 'react-native' {
  export const StyleSheet: any;
  export const View: any;
  export const Text: any;
  export const TouchableOpacity: any;
  export const ScrollView: any;
  export const TextInput: any;
  export const ActivityIndicator: any;
  export const FlatList: any;
  export const RefreshControl: any;
  export const Modal: any;
  export const KeyboardAvoidingView: any;
  export const Alert: {
    alert: (title: string, message?: string, buttons?: any[]) => void;
  };
  export const Vibration: {
    vibrate: (pattern?: any) => void;
    cancel: () => void;
  };
  export const StatusBar: any;
  export const SafeAreaView: any;
  export const Dimensions: {
    get: (dim: 'window' | 'screen') => { width: number; height: number };
  };
  export const Platform: {
    OS: 'ios' | 'android' | 'windows' | 'macos' | 'web';
    select: <T>(obj: Record<string, T>) => T;
  };
  export type ViewStyle = any;
  export type TextStyle = any;
  export type ImageStyle = any;
}

declare module 'expo-router' {
  export const Stack: any;
  export const Tabs: any;
  export const useRouter: () => {
    push: (href: any) => void;
    replace: (href: any) => void;
    back: () => void;
    navigate: (href: any) => void;
    canGoBack: () => boolean;
  };
  export const useLocalSearchParams: <T extends Record<string, any> = Record<string, string>>() => T;
  export const useSegments: () => string[];
  export const Link: any;
  export const Slot: any;
  export const Redirect: any;
}

declare module 'expo-camera' {
  export class CameraView extends React.Component<any, any> {}
  export const useCameraPermissions: () => [
    { granted: boolean } | null,
    () => Promise<{ granted: boolean }>
  ];
  export interface BarcodeScanningResult {
    data: string;
    type: string;
  }
}

declare module 'expo-status-bar' {
  export const StatusBar: React.ComponentType<{
    style?: 'auto' | 'inverted' | 'light' | 'dark';
    backgroundColor?: string;
  }>;
}

declare module 'expo-constants' {
  const Constants: {
    expoConfig?: {
      extra?: Record<string, any>;
    };
    manifest?: Record<string, any>;
  };
  export default Constants;
}

declare module 'expo-linking' {
  export const openURL: (url: string) => Promise<boolean>;
  export const canOpenURL: (url: string) => Promise<boolean>;
  export const createURL: (path: string, options?: any) => string;
  export const useURL: () => string | null;
  export const parse: (url: string) => {
    scheme?: string;
    hostname?: string;
    path?: string;
    queryParams?: Record<string, string>;
  };
}

declare module 'lucide-react-native' {
  import * as React from 'react';
  export interface IconProps {
    color?: string;
    size?: number;
    strokeWidth?: number;
    style?: any;
  }
  export type Icon = React.FC<IconProps>;
  export const Clock: Icon;
  export const Calendar: Icon;
  export const Users: Icon;
  export const QrCode: Icon;
  export const AlertCircle: Icon;
  export const CheckCircle: Icon;
  export const CheckCircle2: Icon;
  export const ArrowRight: Icon;
  export const LogOut: Icon;
  export const Search: Icon;
  export const MapPin: Icon;
  export const Building: Icon;
  export const Building2: Icon;
  export const ChevronRight: Icon;
  export const User: Icon;
  export const Bell: Icon;
  export const RefreshCw: Icon;
  export const ChevronDown: Icon;
  export const Camera: Icon;
  export const FlipHorizontal: Icon;
  export const Home: Icon;
  export const History: Icon;
  export const X: Icon;
  export const Phone: Icon;
  export const Mail: Icon;
  export const Lock: Icon;
  export const Check: Icon;
  export const ArrowLeft: Icon;
  export const Shield: Icon;
  export const ShieldCheck: Icon;
  export const Sparkles: Icon;
  export const HelpCircle: Icon;
  export const Info: Icon;
  export const AlertTriangle: Icon;
  export const LogIn: Icon;
  export const UserCheck: Icon;
  export const Plus: Icon;
  export const Ticket: Icon;
  export const XCircle: Icon;
  export const ExternalLink: Icon;
  export const Tag: Icon;
  export const Keyboard: Icon;
  export const Eye: Icon;
  export const EyeOff: Icon;
  export const Settings: Icon;
  export const Sun: Icon;
  export const Moon: Icon;
  export const Vibrate: Icon;
  export const Smartphone: Icon;
  export const CreditCard: Icon;
  export const Send: Icon;
  export const ThumbsUp: Icon;
  export const ThumbsDown: Icon;
  export const CheckCheck: Icon;
  export const FileText: Icon;
  export const ShieldAlert: Icon;
  export const RotateCcw: Icon;
  export const MessageSquare: Icon;
}

declare module '@react-native-async-storage/async-storage' {
  const AsyncStorage: {
    getItem: (key: string) => Promise<string | null>;
    setItem: (key: string, value: string) => Promise<void>;
    removeItem: (key: string) => Promise<void>;
    clear: () => Promise<void>;
  };
  export default AsyncStorage;
}

declare module 'socket.io-client' {
  export interface Socket {
    on(event: string, fn: (...args: any[]) => void): this;
    off(event: string, fn?: (...args: any[]) => void): this;
    emit(event: string, ...args: any[]): this;
    connect(): this;
    disconnect(): this;
    connected: boolean;
  }
  export function io(uri: string, opts?: any): Socket;
  export default io;
}
