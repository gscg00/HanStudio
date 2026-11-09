// Clases escritas para ir de B1 a B2, por idioma.
import{ENGLISH_B1_PLUS}from'./advanced_english_b1plus.js';
import{ENGLISH_B2}from'./advanced_english_b2.js';
import{GERMAN_B1_PLUS,GERMAN_B2}from'./advanced_german.js';
import{FRENCH_B1_PLUS,FRENCH_B2}from'./advanced_french.js';
import{KOREAN_B1_PLUS,KOREAN_B2}from'./advanced_korean.js';

export const ADVANCED_CLASSES=Object.freeze({English:[...ENGLISH_B1_PLUS,...ENGLISH_B2],German:[...GERMAN_B1_PLUS,...GERMAN_B2],French:[...FRENCH_B1_PLUS,...FRENCH_B2],Korean:[...KOREAN_B1_PLUS,...KOREAN_B2]});
