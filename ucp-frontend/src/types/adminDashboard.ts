export interface ViewCount {
  dossier_id: number;
  total_views: number;
}

export interface DaoDownload {
  dossier_id: number;
  dossier__title: string;
  total_dao_downloads: number;
}

export interface AnnexeRatio {
  dossier_id: number;
  dossier_title: string;
  annexe_name: string;
  total_downloads: number;
  total_market_views: number;
  download_rate_percentage: number;
}

export interface AlertItem {
  id: number;
  title: string;
  deadline: string;
}

export interface InvisibleFolder {
  id: number;
  title: string;
}

export interface MonitoringData {
  closure_rate: number;
  invisible_folders: InvisibleFolder[];
  alerts: AlertItem[];
}

export interface UserTraceability {
  user: string;
  creation_date: string;
  lastLogin: string | null;
  consultations: string[];
  download: string[];
}