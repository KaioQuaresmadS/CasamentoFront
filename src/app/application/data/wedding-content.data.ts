import { Gift } from '../../domain/models/gift.model';
import { WeddingInfo } from '../../domain/models/wedding-info.model';

export const WEDDING_INFO: WeddingInfo = {
  coupleName: 'Ana & Kaio',
  date: '20 de Setembro de 2026',
  pixKey: 'anaekaio@email.com',
  eventCards: [
    {
      label: 'Local',
      title: 'Espaço de Eventos',
      description: 'Rua das Flores, 123 - Cidade/UF'
    },
    {
      label: 'Horário',
      title: '16h30',
      description: 'Chegue com alguns minutos de antecedência para curtirmos tudo com calma.'
    },
    {
      label: 'Traje',
      title: 'Social leve',
      description: 'Escolha algo confortável para cerimônia, fotos e festa.'
    }
  ]
};

export const GIFTS: Gift[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Jogo de panelas',
    description: 'Para começar a casa nova com refeições bem cuidadas.',
    price: 420,
    image: 'https://images.unsplash.com/photo-1584990347449-ae6e1f0da4a9?auto=format&fit=crop&w=900&q=80',
    reservedPercent: 35
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Jantar especial',
    description: 'Uma lembrança para nosso primeiro jantar depois do casamento.',
    price: 280,
    image: 'https://images.unsplash.com/photo-1543353071-10c8ba85a904?auto=format&fit=crop&w=900&q=80',
    reservedPercent: 60
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Cota lua de mel',
    description: 'Ajude com uma parte da nossa viagem e dos passeios.',
    price: 900,
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80',
    reservedPercent: 20
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'Cafeteira',
    description: 'Para os cafés da manhã e visitas na casa nova.',
    price: 360,
    image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=900&q=80',
    reservedPercent: 45
  }
];
