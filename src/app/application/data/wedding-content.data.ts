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
      title: '16h',
      description: 'DEZESSEIS HORAS'
    },
    {
      label: 'Mensagem',
      title: 'ECLESIASTES 4:10-12',
      description:
        '"E, se um cair, o outro levanta o seu companheiro.\nMas ai do que estiver só! Pois, caindo, não haverá quem o levante.\nE, se dois dormirem juntos, eles se aquentarão;\nmas como se aquentará alguém que estiver só?\nE, se alguém prevalecer contra um, dois lhe resistirão;\ne o cordão de três dobras não se rompe facilmente."\n\nContamos com a sua presença!'
    }
  ]
};
