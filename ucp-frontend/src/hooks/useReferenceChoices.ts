"use client";

import { useEffect, useRef, useState } from "react";

import {
  fetchReferenceChoices,
  type ReferenceChoiceOption,
} from "@/services/choices";

export function useReferenceChoices(
  group: string,
  fallback: ReferenceChoiceOption[] = [],
): ReferenceChoiceOption[] {
  const fallbackRef = useRef(fallback);
  const [options, setOptions] = useState<ReferenceChoiceOption[]>(fallback);

  useEffect(() => {
    fallbackRef.current = fallback;
  });

  useEffect(() => {
    let cancelled = false;
    fetchReferenceChoices(group)
      .then((data) => {
        if (cancelled) return;
        const groupChoices = data[group];
        setOptions(
          groupChoices && groupChoices.length > 0 ? groupChoices : fallbackRef.current,
        );
      })
      .catch((error) => {
        if (cancelled) return;
        console.error(
          `[useReferenceChoices] Échec du chargement du groupe "${group}", options statiques de secours utilisées.`,
          error,
        );
        setOptions(fallbackRef.current);
      });
    return () => {
      cancelled = true;
    };
  }, [group]);

  return options;
}
