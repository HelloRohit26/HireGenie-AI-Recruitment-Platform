declare module 'sarvam-convai-embed' {
  export interface SarvamSessionConfig {
    apiKey?: string;
    orgId?: string;
    workspaceId?: string;
    appId?: string;
    userId?: string;
    interactionType?: 'call' | 'chat';
    agentVariables?: Record<string, any>;
    onStateChange?: (state: string) => void;
    [key: string]: any;
  }

  export class SarvamSession {
    constructor(config: SarvamSessionConfig);
    start(): Promise<void>;
    stop(): Promise<void>;
    on(event: string, callback: (data: any) => void): void;
    off(event: string, callback?: (data: any) => void): void;
    [key: string]: any;
  }

  export function initSarvamWidget(containerIdOrConfig: string | SarvamSessionConfig, config?: SarvamSessionConfig): any;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'sarvam-widget': any;
    }
  }
}
