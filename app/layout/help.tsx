import helps from '../help';

export default function Help({ help = [ "root" ] }: { help?: Array<string> }) {
  const [ active ] = help;
  const Help = helps.get(active);
  
  return (
    <span className="prose">
      <Help />
    </span>
  );
}