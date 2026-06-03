import { WeddingInfo } from '../../domain/models/wedding-info.model';

export const WEDDING_INFO: WeddingInfo = {
  coupleName: 'Kaio e Ana',
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
      title: 'ECLESIASTES 4:10-12',
      description:
        'Queremos convidar você para o nosso casamento!!\nA cerimônia acontecerá no templo onde nos juntamos para celebrar a Deus e desejamos que esteja conosco nesse dia especial.\n\n10 Porque se um cair, o outro levanta o seu companheiro; mas ai do que estiver só; pois, caindo, não haverá outro que o levante.\n11 Também, se dois dormirem juntos, eles se aquentarão; mas um só, como se aquentará?\n12 E, se alguém prevalecer contra um, os dois lhe resistirão; e o cordão de três dobras não se quebra tão depressa.'
    }
  ]
};
