import React from 'react';
import { useStore } from '@/context/AppContext';

const AlKahfReminder: React.FC = () => {
  const { t } = useStore();
  return (
    <div className="text-sm text-left max-w-md p-1">
      <h3 className="font-bold text-base mb-2 text-text-main">{t('kahfReminderTitleShort')}</h3>
      
      <div className="mb-4 text-text-secondary">
        <p className="mb-2">{t('kahfReminderBismillah')}</p>
        <p className="italic">{t('kahfHadith')}</p>
        <p className="text-xs opacity-80 mt-1">{t('kahfHadithSourceExtended')}</p>
        <p className="text-xs opacity-80 mt-2">{t('kahfReminderNote')}</p>
      </div>

      <div className="border-t border-border-main pt-3">
        <p className="font-amiri text-lg rtl text-right leading-relaxed text-text-main">
          عن أبي سعيد الخدري رضي الله عنه قال النبي صلى الله عليه و سلم : من قرأ سورةَ الكهفِ في يومِ الجمعةِ أضاء له من النورِ ما بين الجمُعتَينِ
        </p>
         <p className="text-xs rtl text-right opacity-80 mt-1 text-text-secondary">
          (رواه البيهقي و صححه الشيخ الألباني في صحيح الجامع رقم ٦٤٧٠)
        </p>
      </div>
    </div>
  );
};

export default AlKahfReminder;