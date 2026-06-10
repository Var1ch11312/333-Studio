import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Политика за поверителност — AMUR.BG",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Политика за поверителност" updated="юни 2026">
      <LegalSection title="1. Какви данни събираме">
        <p>
          За изпълнение на поръчката събираме: име, телефон, адрес за доставка и
          съдържание на поръчката. Данните за банкови карти се обработват
          изцяло от Stripe и никога не достигат до нашите сървъри.
        </p>
      </LegalSection>
      <LegalSection title="2. Цел и правно основание (GDPR чл. 6)">
        <p>
          Обработваме данните единствено за изпълнение на договора за доставка
          (чл. 6, ал. 1, б. „б" GDPR) и за законови счетоводни задължения
          (чл. 6, ал. 1, б. „в" GDPR). Не продаваме данни на трети страни.
        </p>
      </LegalSection>
      <LegalSection title="3. Споделяне с подизпълнители">
        <p>
          Адресът и телефонът на получателя се споделят само с флориста и
          куриера, изпълняващи конкретната поръчка, чрез WhatsApp Business API.
          Хостинг: Vercel (ЕС region), база данни: Supabase.
        </p>
      </LegalSection>
      <LegalSection title="4. Срок на съхранение">
        <p>
          Данните за поръчки се съхраняват 5 години съгласно българското
          счетоводно законодателство. Снимките от доставка се съхраняват 1 година.
        </p>
      </LegalSection>
      <LegalSection title="5. Вашите права">
        <p>
          Имате право на достъп, коригиране, изтриване и преносимост на личните
          си данни, както и право на жалба до КЗЛД (cpdp.bg). Заявки:
          privacy@amur.bg.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
