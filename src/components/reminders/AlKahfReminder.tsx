import React from 'react';

const AlKahfReminder: React.FC = () => {
  return (
    <div className="text-sm text-left max-w-md p-1">
      <h3 className="font-bold text-base mb-2 text-text-main">Celui qui lit la sourate Al Kahf (La caverne) un vendredi</h3>
      
      <div className="mb-4 text-text-secondary">
        <p className="mb-2">Au nom d'Allah, le Tout Miséricordieux, le Très Miséricordieux.</p>
        <p className="italic">
          D'après Abou Said Al Khoudri (qu'Allah l'agrée), le Prophète (que la prière d'Allah et Son salut soient sur lui) a dit: « Celui qui lit la sourate Al Kahf le jour du vendredi, il est éclairé par une lumière entre les deux vendredis (*_*) ».
        </p>
        <p className="text-xs opacity-80 mt-1">
          (Rapporté par Al Bayhaqi et authentifié par Cheikh Albani dans Sahih Al Jami n°6470)
        </p>
        <p className="text-xs opacity-80 mt-2">
          (*) C'est à dire entre le vendredi où la personne l'a lu jusqu'au vendredi suivant.
        </p>
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