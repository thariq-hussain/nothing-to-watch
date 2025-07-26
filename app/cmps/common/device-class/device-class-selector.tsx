import { TabletSmartphone } from 'lucide-react'
import { useMemo } from 'react'
import { cn } from '../../../utils/tw'
import { type DEVICE_CLASS, DEVICE_CLASS_ITEMS } from '../../../vf/consts.ts'
import { Badge } from '../../ui/badge'
import { Selector, type SelectorItems } from '../selector'

export function DeviceClassSelector({
  className = '',
  value,
  estimatedValue,
  onValueChange,
}: {
  className?: string
  value?: DEVICE_CLASS
  estimatedValue?: DEVICE_CLASS
  onValueChange: (value: DEVICE_CLASS) => void
}) {
  const deviceClassItems: SelectorItems = useMemo(() => {
    return DEVICE_CLASS_ITEMS.map((deviceClass) => {
      return {
        label: deviceClass.name,
        value: String(deviceClass.id),
        addon:
          estimatedValue === deviceClass.id ? (
            <Badge className='-translate-x-1/2 -translate-y-1/2 !text-background pointer-events-none absolute top-0 left-1/2 text-xxs'>
              Estimated
            </Badge>
          ) : undefined,
      }
    })
  }, [estimatedValue])

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex items-center gap-2 font-semibold text-xl text-zinc-900 dark:text-white'>
        <TabletSmartphone className='h-5 w-5 text-zinc-900 dark:text-white' />
        Your device
      </div>
      <Selector
        className={cn('', className)}
        defaultValue={String(value)}
        onValueChange={(value) => {
          onValueChange(Number.parseInt(value) as DEVICE_CLASS)
        }}
        items={deviceClassItems}
      />
    </div>
  )
}
