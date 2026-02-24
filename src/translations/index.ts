import { Language } from "@/types";
import { fr } from './fr';
import { en } from './en';
import { ar } from './ar';

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
    fr,
    en,
    ar
};