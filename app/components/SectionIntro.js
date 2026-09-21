import Icon from './Icon';
import BrandScene from './BrandScene';

const sections = {
  suppliers: { icon: 'users', eyebrow: 'LE RÉSEAU SOYCAIN', title: 'Des relations qui portent leurs fruits.', text: 'Retrouvez vos partenaires et faites grandir votre réseau de sourcing.' },
  products: { icon: 'leaf', eyebrow: 'LE CATALOGUE SOYCAIN', title: 'Le meilleur de chaque origine.', text: 'Explorez vos matières premières et comparez les offres de vos fournisseurs.' },
  categories: { icon: 'layers', eyebrow: 'LES FILIÈRES SOYCAIN', title: 'Toute la richesse du végétal.', text: 'Structurez votre catalogue par famille pour mieux explorer vos filières.' },
  import: { icon: 'upload', eyebrow: 'VOTRE BASE, ENRICHIE', title: 'De nouvelles sources. De nouvelles possibilités.', text: 'Importez, vérifiez, puis confirmez. Vous gardez la maîtrise de vos données.' },
};

export default function SectionIntro({ section }) {
  const content = sections[section];
  return (
    <section className={`section-intro section-intro-${section}`}>
      <div className="section-intro-copy">
        <p className="eyebrow"><Icon name={content.icon} size={15} />{content.eyebrow}</p>
        <h2>{content.title}</h2>
        <p>{content.text}</p>
      </div>
      <BrandScene />
    </section>
  );
}
