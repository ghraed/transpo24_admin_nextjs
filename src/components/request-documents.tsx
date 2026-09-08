'use client';
import React from 'react';
import { API_URL, axiosInstance } from '@/providers/data-provider';
import { Button } from '@/components/ui/button';
const labels: Record<string, string> = {
  PICKUP_AUTHORIZATION: 'Abholvollmacht',
  INSURANCE: 'Versicherungsdokument',
  PURCHASE_PROOF: 'Kaufnachweis',
  OTHER: 'Sonstiges Dokument',
};
type FileItem = {
  id: string;
  fileName: string;
  documentType: string | null;
  mimeType: string;
  size: number;
  createdAt: string;
};
export function RequestDocuments({ requestId }: { requestId: string }) {
  const [open, setOpen] = React.useState(false);
  const [files, setFiles] = React.useState<FileItem[]>([]);
  const [chatFiles, setChatFiles] = React.useState<FileItem[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const load = async () => {
    setBusy(true);
    setError('');
    try {
      const { data } = await axiosInstance.get(
        `${API_URL}/request-files/request/${encodeURIComponent(requestId)}`,
      );
      setFiles(data.files);
      setChatFiles(data.chatFiles ?? []);
      setOpen(true);
    } catch {
      setError('Unable to load private documents. Please retry.');
    } finally {
      setBusy(false);
    }
  };
  const download = async (file: FileItem) => {
    setBusy(true);
    setError('');
    try {
      const response = await axiosInstance.get(
        `${API_URL}/request-files/${encodeURIComponent(file.id)}/content`,
        { responseType: 'blob' },
      );
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.fileName;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      setError('Unable to download this document.');
    } finally {
      setBusy(false);
    }
  };
  const list = (items: FileItem[]) =>
    items.length ? (
      <ul className="space-y-2">
        {items.map((file) => (
          <li
            key={file.id}
            className="rounded-xl border bg-background p-3 text-sm"
          >
            <div className="font-medium">
              {file.documentType
                ? labels[file.documentType]
                : 'Chat attachment'}
            </div>
            <div className="break-all text-muted-foreground">
              {file.fileName} · {Math.ceil(file.size / 1024)} KB
            </div>
            <div className="my-2 text-xs text-muted-foreground">
              {new Date(file.createdAt).toLocaleString()}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => void download(file)}
            >
              Download
            </Button>
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-sm text-muted-foreground">No files attached.</p>
    );
  return (
    <div className="rounded-2xl border p-4 xl:col-span-3 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold">Private vehicle documents</h3>
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => void load()}
        >
          {busy ? 'Loading…' : open ? 'Refresh' : 'View documents'}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Only the customer, selected driver and administration can access these
        files.
      </p>
      {error ? (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : null}
      {open ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Official documents</h4>
            {list(files)}
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Additional chat files</h4>
            {list(chatFiles)}
          </div>
        </div>
      ) : null}
    </div>
  );
}
