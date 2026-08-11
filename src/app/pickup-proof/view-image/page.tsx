"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { API_URL, axiosInstance } from "@/providers/data-provider";

export default function ViewProofImagePage() {
  const searchParams = useSearchParams();
  const proofId = searchParams.get("proofId");
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!proofId) {
      setError("No proof image was selected.");
      return;
    }

    let objectUrl: string | null = null;
    axiosInstance
      .get(`${API_URL}/admin/delivery-operations/proofs/${encodeURIComponent(proofId)}/view-image`, {
        responseType: "blob",
      })
      .then(({ data }) => {
        objectUrl = URL.createObjectURL(data as Blob);
        setImageUrl(objectUrl);
      })
      .catch(() => setError("This proof image is unavailable or could not be loaded."));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [proofId]);

  if (error) return <main className="grid min-h-screen place-items-center bg-muted p-6 text-center text-sm text-muted-foreground">{error}</main>;
  if (!imageUrl) return <main className="grid min-h-screen place-items-center bg-muted"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></main>;

  return <main className="grid min-h-screen place-items-center bg-black p-4"><img src={imageUrl} alt="Delivery proof" className="max-h-[calc(100vh-2rem)] max-w-full rounded-lg object-contain" /></main>;
}
