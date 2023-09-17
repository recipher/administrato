import { useTranslation } from 'react-i18next';
import content from '../help';
import type { HelpFile } from '../hooks/use-help';

import Tabs from '~/components/tabs';

type Props = { 
  helps: Array<HelpFile>;
  active: string;
  onChangeHelp: Function;
}

export default function Help({ helps, active, onChangeHelp }: Props) {
  const { t } = useTranslation();
  const Help = content.get(active);
  
  const tabs = helps.map((help: HelpFile) => ({
    name: t(help.identifier),
    value: help.identifier,
  }));

  return (
    <span className="prose">
      <Tabs tabs={tabs} selected={active} onClick={onChangeHelp}/>
      <Help />
    </span>
  );
}