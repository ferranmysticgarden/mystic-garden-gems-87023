import { Button } from '@/components/ui/button';
import { ArrowLeft, HelpCircle, Gem, Sparkles } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

interface Props {
  onBack: () => void;
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="border bg-card/70 p-4 mb-3" style={{ borderRadius: 8 }}>
    <h2 className="text-base font-bold mb-2 text-primary">{title}</h2>
    <div className="text-sm text-foreground/90 space-y-1.5">{children}</div>
  </section>
);

const Row = ({ icon, label, value }: { icon: string; label: string; value?: React.ReactNode }) => (
  <div className="flex items-start gap-2">
    <span className="text-xl leading-none w-7 shrink-0 text-center">{icon}</span>
    <div className="flex-1">
      <span className="font-semibold">{label}</span>
      {value && <span className="text-muted-foreground"> — {value}</span>}
    </div>
  </div>
);

export const HowToPlayScreen = ({ onBack }: Props) => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-md mx-auto p-4 pb-24">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            {t('howtoplay.title')}
          </h1>
          <div className="w-10" />
        </div>

        <Section title={t('howtoplay.matches.title')}>
          <Row icon="🟰" label={t('howtoplay.matches.m3')} value="30 pts" />
          <Row icon="💥" label={t('howtoplay.matches.m4')} value="80 pts + bonus" />
          <Row icon="⚡" label={t('howtoplay.matches.m5')} value="150 pts + bonus" />
          <Row icon="🌟" label={t('howtoplay.matches.m6')} value="300 pts" />
          <p className="text-xs text-muted-foreground pt-1">{t('howtoplay.matches.hint')}</p>
        </Section>

        <Section title={t('howtoplay.combos.title')}>
          <p>{t('howtoplay.combos.desc')}</p>
          <div className="grid grid-cols-2 gap-2 pt-2">
            <div className="bg-muted/40 p-2 rounded"><b>x2</b> — {t('combo.genial')}</div>
            <div className="bg-muted/40 p-2 rounded"><b>x3</b> — {t('combo.incredible')}</div>
            <div className="bg-muted/40 p-2 rounded"><b>x4</b> — {t('combo.spectacular')}</div>
            <div className="bg-muted/40 p-2 rounded"><b>x5</b> — {t('combo.magic')}</div>
          </div>
        </Section>

        <Section title={t('howtoplay.powerups.title')}>
          <Row icon="🔨" label={t('howtoplay.powerups.hammer')} value={<span><Gem className="inline w-3 h-3" /> 40</span>} />
          <Row icon="🔄" label={t('howtoplay.powerups.change')} value={<span><Gem className="inline w-3 h-3" /> 60</span>} />
          <Row icon="↩️" label={t('howtoplay.powerups.undo')} value={<span><Gem className="inline w-3 h-3" /> 25</span>} />
          <p className="text-xs text-muted-foreground pt-1">{t('howtoplay.powerups.hint')}</p>
        </Section>

        <Section title={t('howtoplay.objectives.title')}>
          <Row icon="🎯" label={t('howtoplay.objectives.collect')} />
          <Row icon="🏆" label={t('howtoplay.objectives.score')} />
          <Row icon="✨" label={t('howtoplay.objectives.bonus')} />
        </Section>

        <Section title={t('howtoplay.themes.title')}>
          <p>{t('howtoplay.themes.desc')}</p>
        </Section>

        <Section title={t('howtoplay.economy.title')}>
          <Row icon="❤️" label={t('howtoplay.economy.lives')} />
          <Row icon="🐷" label={t('howtoplay.economy.piggy')} />
          <Row icon="🎫" label={t('howtoplay.economy.pass')} />
          <Row icon="🔥" label={t('howtoplay.economy.streak')} />
        </Section>

        <div className="text-center text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3" /> {t('howtoplay.footer')}
        </div>
      </div>
    </div>
  );
};
