import prisma from '@/lib/prisma'
import { TelegramFormShell } from '@/components/telegram-form-shell'
import { AppSettingsForm } from '@/components/forms/app-settings-form'

const SETTINGS_ID = 'app'

async function getSettings() {
  return prisma.appSettings.upsert({
    where: { id: SETTINGS_ID },
    update: {},
    create: { id: SETTINGS_ID },
  })
}

export default async function AdminSettingsPage() {
  const settings = await getSettings()

  return (
    <TelegramFormShell title="የቦት ቅንብሮች" description="የቦቱን ስምና ዝርዝሮች ያስተካክሉ">
      <AppSettingsForm
        initialSettings={{
          app_name: settings.app_name,
          bot_description: settings.bot_description,
          bot_short_description: settings.bot_short_description,
        }}
      />
    </TelegramFormShell>
  )
}
