"use client";

import { useEffect, useState } from "react";
import "./i18n";

export function I18nInitializer() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return null;
}
