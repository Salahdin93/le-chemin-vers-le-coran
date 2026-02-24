import { jsPDF } from 'jspdf';
import { AppState } from '@/types';

interface ShareOptions {
    shareReading: boolean;
    shareRevision: boolean;
}

const generateShareText = (state: AppState, t: (key: string, replacements?: any) => string, options: ShareOptions): string => {
    let message = `📖 *${t('appName')} - ${t('shareProgress')}*\n\n`;

    if (options.shareReading) {
        message += `*${t('readingHistoryTitle')}*\n`;
        const readingDaysCompleted = state.progress.currentReadingDay - 1;
        if (readingDaysCompleted > 0) {
            for (let i = 1; i <= readingDaysCompleted; i++) {
                const dayData = state.progress.readingHistory[`day_${i}`];
                if (!dayData) continue;

                let statusIcon = '✅';
                let details = '';
                
                if (dayData.status === 'not_read') statusIcon = '🚫';
                
                if (dayData.adjustment > 0) {
                    details += ` + ${dayData.adjustment} pages`;
                } else if (dayData.adjustment < 0) {
                    statusIcon = '🚫';
                    details += ` - ${Math.abs(dayData.adjustment)} pages`;
                }

                if (dayData.kahf) {
                    details += ` + al kahf`;
                }

                message += `Jour ${i} : lecture ${statusIcon}${details}\n`;
            }
        } else {
            message += `${t('noReadingHistory')}\n`;
        }
    }

    if (options.shareRevision) {
         message += `\n*${t('revisionHistoryTitle')}*\n`;
        if (state.plans.revision && state.progress.currentRevisionIndex > 0) {
            for (let i = 0; i < state.progress.currentRevisionIndex; i++) {
                const dayPlan = state.plans.revision[i];
                const statusIcon = dayPlan.status === 'revised' ? '✅' : (dayPlan.status === 'to-review' ? '🔁' : '❌');
                message += `${t('day')} ${dayPlan.day}: ${dayPlan.units.map(u => u.text).join(' + ')} ${statusIcon}\n`;
            }
        } else {
            message += `${t('noRevisionHistory')}\n`;
        }
    }
    
    return message;
};

export const shareViaWhatsApp = (state: AppState, t: (key: string, replacements?: any) => string, options: ShareOptions) => {
    const message = generateShareText(state, t, options);
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
};

export const generateProgressPDF = (
    state: AppState, 
    t: (key: string, replacements?: any) => string,
    startDate?: string,
    endDate?: string
) => {
    const activeProfile = state.profiles.find(p => p.id === state.activeProfileId);
    if (!activeProfile) return;

    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(`Suivi de ${activeProfile.name}`, 15, 20);
    doc.setFontSize(10);
    doc.text(`Généré le: ${new Date().toLocaleDateString()}`, 15, 25);
    
    let y = 35;
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(t('readingHistoryTitle'), 15, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    
    const startDateObj = startDate ? new Date(startDate) : null;
    const endDateObj = endDate ? new Date(endDate) : null;
    if (endDateObj) endDateObj.setHours(23, 59, 59, 999);

    const planStartDate = state.progress.startDate ? new Date(state.progress.startDate) : null;
    let filteredReadingHistory = Object.entries(state.progress.readingHistory);

    if (planStartDate && (startDateObj || endDateObj)) {
        filteredReadingHistory = filteredReadingHistory.filter(([dayKey]) => {
            const dayNumber = parseInt(dayKey.replace('day_', ''), 10);
            if (isNaN(dayNumber)) return false;

            const entryDate = new Date(planStartDate);
            entryDate.setDate(entryDate.getDate() + dayNumber - 1);
            const isAfterStart = startDateObj ? entryDate >= startDateObj : true;
            const isBeforeEnd = endDateObj ? entryDate <= endDateObj : true;
            return isAfterStart && isBeforeEnd;
        });
    }

    if (filteredReadingHistory.length > 0) {
        for (const [dayKey, dayData] of filteredReadingHistory) {
            if (y > 280) { doc.addPage(); y = 20; }
            const dayNumber = dayKey.replace('day_', '');
            doc.text(`${t('day')} ${dayNumber}: ${dayData.realPages} pages lues (${dayData.status})`, 15, y);
            y += 7;
        }
    } else {
        doc.text(t('noReadingHistory'), 15, y); y += 7;
    }

    y += 10;
    if (y > 280) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(t('revisionHistoryTitle'), 15, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    const revisionHistory = state.plans.revision?.slice(0, state.progress.currentRevisionIndex) || [];
    let filteredRevisionHistory = revisionHistory;

    if (startDateObj || endDateObj) {
        filteredRevisionHistory = revisionHistory.filter(dayPlan => {
            const entryDate = new Date(dayPlan.date);
            const isAfterStart = startDateObj ? entryDate >= startDateObj : true;
            const isBeforeEnd = endDateObj ? entryDate <= endDateObj : true;
            return isAfterStart && isBeforeEnd;
        });
    }

    if (filteredRevisionHistory.length > 0) {
        for (const dayPlan of filteredRevisionHistory) {
             if (y > 280) { doc.addPage(); y = 20; }
            const text = `${t('day')} ${dayPlan.day}: ${dayPlan.units.map(u => u.text).join(' + ')} - ${dayPlan.status}`;
            doc.text(text, 15, y);
            y += 7;
        }
    } else {
        doc.text(t('noRevisionHistory'), 15, y);
    }

    doc.save(`suivi-coran-${activeProfile.name}.pdf`);
};

export const exportUserData = () => {
    const dataToSave = localStorage.getItem('quranCompanionState_v7');
    if (!dataToSave) {
        alert('Aucune donnée à sauvegarder.');
        return;
    }
    const blob = new Blob([dataToSave], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lecture-quran-sauvegarde.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const importUserData = (event: React.ChangeEvent<HTMLInputElement>, onSuccess: () => void) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = e.target?.result as string;
            JSON.parse(importedData);
            localStorage.setItem('quranCompanionState_v7', importedData);
            alert("✅ Sauvegarde restaurée avec succès ! L'application va redémarrer.");
            onSuccess();
        } catch (error) {
            console.error("Erreur lors de la restauration : ", error);
            alert("❌ Erreur: Le fichier est peut-être invalide.");
        }
    };
    reader.readAsText(file);
};