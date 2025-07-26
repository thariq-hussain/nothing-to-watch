import { Settings2 } from 'lucide-react'
import { useMemo } from 'react'
import { isDefined } from '../../../utils/misc'
import { cn } from '../../../utils/tw'
import type { VOROFORCE_PRESET } from '../../../vf'
import { type DEVICE_CLASS, PRESET_ITEMS } from '../../../vf/consts.ts'
import { DeviceClassWarningMessage } from '../device-class/device-class-warning-message'
import { Selector, type SelectorItems } from '../selector'

type NoArray<T> = T extends Array<unknown> ? never : T

const processPresetItem = (
  presetItem: NoArray<(typeof PRESET_ITEMS)[number]>,
  deviceClass?: DEVICE_CLASS,
) => ({
  label: (
    <>
      {presetItem.videoSrc && (
        <video
          className='absolute inset-0 h-full w-full object-cover object-center'
          playsInline
          autoPlay
          muted
          controls={false}
          loop
        >
          <source src={presetItem.videoSrc} type='video/webm' />
        </video>
      )}
      {presetItem.imgSrc && (
        <img
          className='absolute inset-0 h-full w-full object-cover object-center'
          src={presetItem.imgSrc}
          alt={presetItem.name}
        />
      )}
      <div className='relative z-2'>{presetItem.name}</div>
    </>
  ),
  value: presetItem.id,
  hasWarning:
    isDefined(presetItem.recommendedDeviceClass) &&
    isDefined(deviceClass) &&
    presetItem.recommendedDeviceClass > deviceClass,
})

export function PresetSelector({
  className = '',
  value,
  onValueChange,
  deviceClass,
}: {
  className?: string
  value?: VOROFORCE_PRESET
  onValueChange: (value: VOROFORCE_PRESET) => void
  deviceClass?: DEVICE_CLASS
}) {
  const presetItems: SelectorItems = useMemo(() => {
    return PRESET_ITEMS.map((presetItem) => {
      return Array.isArray(presetItem)
        ? presetItem.map((subPresetItem) =>
            processPresetItem(subPresetItem, deviceClass),
          )
        : processPresetItem(presetItem, deviceClass)
    })
  }, [deviceClass])

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className='flex items-end gap-4'>
        <div className='flex items-center gap-2 font-semibold text-xl text-zinc-900 leading-none dark:text-white'>
          <Settings2 className='h-5 w-5 text-zinc-900 dark:text-white' />
          Preset
        </div>
        {/*<p className='text-sm text-zinc-600 leading-none dark:text-zinc-300'>*/}
        {/*  You can change this later*/}
        {/*</p>*/}
      </div>
      <Selector
        itemClassName='text-white light:bg-foreground'
        itemBgClassName='z-1'
        defaultValue={value}
        onValueChange={(value) => {
          onValueChange(value as VOROFORCE_PRESET)
        }}
        items={presetItems}
        warningMessage={<DeviceClassWarningMessage deviceClass={deviceClass} />}
      />
    </div>
  )
}
