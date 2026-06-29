<<<<<<< HEAD
"use client"

import { FileText, Calendar, RefreshCw } from "lucide-react"
import { Button } from "@/TdrSt/dashboard/ui/button"
=======
"use client";

import { FileText, RefreshCw } from "lucide-react";
>>>>>>> 7b486334ce89722f0fe5f9ac46339b85f31f2c7d

export function DashboardHeader() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Gestion Documentaire
          </h1>
          <p className="text-sm text-muted-foreground">
            Tableau de bord des indicateurs
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
<<<<<<< HEAD
        <Button variant="outline" size="sm" className="gap-2 border-border/50 bg-card/50">
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Actualiser</span>
        </Button>
      </div>
    </div>
  )
=======
        <button className="inline-flex items-center gap-2 rounded-md border border-border/50 bg-card/50 px-3 py-2 text-sm">
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Actualiser</span>
        </button>
      </div>
    </div>
  );
>>>>>>> 7b486334ce89722f0fe5f9ac46339b85f31f2c7d
}
