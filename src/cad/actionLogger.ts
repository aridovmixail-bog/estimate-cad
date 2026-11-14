export interface ActionLogEntry {
  id: string;
  type: 'warning' | 'delete' | 'draw' | 'click' | 'tool' | 'key' | 'info' | string;
  title: string;
  details?: string;
  advice?: string;
  time: string;
  timestamp: number;
}

type ActionLogListener = (logs: ActionLogEntry[]) => void;

class ActionLoggerService {
  private logs: ActionLogEntry[] = [];
  private listeners: Set<ActionLogListener> = new Set();
  private maxLogs: number = 80;

  constructor() {
    try {
      const saved = localStorage.getItem('estimate_cad_action_logs');
      if (saved) {
        this.logs = JSON.parse(saved);
      }
    } catch {}
  }

  public subscribe(listener: ActionLogListener): () => void {
    this.listeners.add(listener);
    listener([...this.logs]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const copy = [...this.logs];
    try {
      localStorage.setItem('estimate_cad_action_logs', JSON.stringify(copy.slice(0, 50)));
    } catch {}
    this.listeners.forEach((l) => l(copy));
  }

  public addLog(
    type: ActionLogEntry['type'],
    title: string,
    details?: string,
    advice?: string
  ): void {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const entry: ActionLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      title,
      details,
      advice,
      time: timeStr,
      timestamp: Date.now()
    };

    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
    this.notify();
  }

  public clear(): void {
    this.logs = [];
    try {
      localStorage.removeItem('estimate_cad_action_logs');
    } catch {}
    this.notify();
  }

  public getLogs(): ActionLogEntry[] {
    return [...this.logs];
  }
}

export const actionLogger = new ActionLoggerService();
