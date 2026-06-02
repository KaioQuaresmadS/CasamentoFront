import { WeddingInfo } from '../../domain/models/wedding-info.model';

export const WEDDING_INFO: WeddingInfo = {
  coupleName: 'Ana & Kaio',
  date: '10/10/2026',
  eventCards: [
    {
      label: 'Data',
      title: '10/10/2026',
      description: 'DEZ DE OUTUBRO\nDE DOIS MIL E VINTE E SEIS'
    },
    {
      label: 'Local',
      title: 'IBNELVE',
      description: 'RUA 15, 41 LIBERDADE\nRIBEIRÃO DAS NEVES - MG'
    },
    {
      label: 'Horário',
      title: '15:00',
      description: 'QUINZE HORAS'
    },
    {
      label: 'Mensagem',
      title: 'Convite',
      description:
        'Com grande alegria, queremos convidar você para celebrar conosco um dos momentos mais importantes de nossas vidas. Nossa cerimônia acontecerá na igreja onde congregamos e servimos ao Senhor, um lugar que faz parte da nossa caminhada de fé e onde desejamos receber a bênção de Deus para esta nova etapa.Será uma honra ter você conosco nesse dia tão especial, compartilhando esse momento de amor, gratidão e alegria diante de Deus. Eclesiastes 4:10-12'
    }
  ]
};
