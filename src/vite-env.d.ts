/// <reference types="vite/client" />
import 'jspdf';

declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => void;
    }
}