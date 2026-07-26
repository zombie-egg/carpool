"use client";

import { useState } from "react";
import { Loader2, Save, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PHONE_REGEX } from "@/lib/constants";
import type { CarType, DriverInfoDTO, DriverPayload } from "@/lib/types";

const PRESET_CAR_TYPES: ReadonlyArray<CarType> = ["sedan", "suv", "mpv"];
const CUSTOM_CAR_TYPE = "__custom__";

interface DriverFormState {
  driverName: string;
  phone: string;
  wechat: string;
  licensePlate: string;
  carColor: string;
  operationStartDate: string;
  operationEndDate: string;
  dailyAvailableStart: string;
  dailyAvailableEnd: string;
  carTypePreset: string;
  carTypeCustom: string;
  discountInfo: string;
  carRemark: string;
}

const EMPTY_STATE: DriverFormState = {
  driverName: "",
  phone: "",
  wechat: "",
  licensePlate: "",
  carColor: "",
  operationStartDate: "",
  operationEndDate: "",
  dailyAvailableStart: "",
  dailyAvailableEnd: "",
  carTypePreset: "",
  carTypeCustom: "",
  discountInfo: "",
  carRemark: "",
};

type DriverFieldErrors = Partial<
  Record<keyof DriverFormState | "carType", string>
>;

function stateFromDriver(driver: DriverInfoDTO): DriverFormState {
  const isPreset = (PRESET_CAR_TYPES as readonly string[]).includes(
    driver.carType
  );
  return {
    driverName: driver.driverName,
    phone: driver.phone,
    wechat: driver.wechat ?? "",
    licensePlate: driver.licensePlate,
    carColor: driver.carColor ?? "",
    operationStartDate: driver.operationStartDate.slice(0, 10),
    operationEndDate: driver.operationEndDate.slice(0, 10),
    dailyAvailableStart: driver.dailyAvailableStart,
    dailyAvailableEnd: driver.dailyAvailableEnd,
    carTypePreset: isPreset ? driver.carType : CUSTOM_CAR_TYPE,
    carTypeCustom: isPreset ? "" : driver.carType,
    discountInfo: driver.discountInfo ?? "",
    carRemark: driver.carRemark ?? "",
  };
}

interface DriverFormProps {
  // When provided, the form edits this driver (PUT); otherwise it creates one.
  initialDriver?: DriverInfoDTO;
  onSaved: (driver: DriverInfoDTO) => void;
  onCancel?: () => void;
}

// Add/edit driver form shared by both tabs of the management center.
export function DriverForm({ initialDriver, onSaved, onCancel }: DriverFormProps) {
  const t = useTranslations("driver");
  const [form, setForm] = useState<DriverFormState>(
    initialDriver ? stateFromDriver(initialDriver) : EMPTY_STATE
  );
  const [errors, setErrors] = useState<DriverFieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const isEdit = Boolean(initialDriver);
  const idSuffix = initialDriver?.id ?? "new";

  const update = (patch: Partial<DriverFormState>) => {
    setForm((current) => ({ ...current, ...patch }));
  };

  function resolveCarType(): string {
    if (form.carTypePreset === CUSTOM_CAR_TYPE) {
      return form.carTypeCustom.trim();
    }
    return form.carTypePreset;
  }

  function validate(): DriverFieldErrors {
    const next: DriverFieldErrors = {};
    if (!form.driverName.trim()) next.driverName = t("errors.required");
    if (!form.phone.trim()) {
      next.phone = t("errors.required");
    } else if (!PHONE_REGEX.test(form.phone.trim())) {
      next.phone = t("errors.phone");
    }
    if (!form.licensePlate.trim()) next.licensePlate = t("errors.required");
    if (!form.operationStartDate) next.operationStartDate = t("errors.required");
    if (!form.operationEndDate) {
      next.operationEndDate = t("errors.required");
    } else if (
      form.operationStartDate &&
      form.operationEndDate < form.operationStartDate
    ) {
      next.operationEndDate = t("errors.dateOrder");
    }
    if (!form.dailyAvailableStart) {
      next.dailyAvailableStart = t("errors.required");
    }
    if (!form.dailyAvailableEnd) {
      next.dailyAvailableEnd = t("errors.required");
    } else if (
      form.dailyAvailableStart &&
      form.dailyAvailableEnd <= form.dailyAvailableStart
    ) {
      next.dailyAvailableEnd = t("errors.timeOrder");
    }
    if (!resolveCarType()) next.carType = t("errors.required");
    return next;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFailed(false);
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const payload: DriverPayload = {
      driverName: form.driverName.trim(),
      phone: form.phone.trim(),
      wechat: form.wechat.trim() || undefined,
      licensePlate: form.licensePlate.trim(),
      carColor: form.carColor.trim() || undefined,
      operationStartDate: form.operationStartDate,
      operationEndDate: form.operationEndDate,
      dailyAvailableStart: form.dailyAvailableStart,
      dailyAvailableEnd: form.dailyAvailableEnd,
      carType: resolveCarType(),
      discountInfo: form.discountInfo.trim() || undefined,
      carRemark: form.carRemark.trim() || undefined,
    };

    setSaving(true);
    try {
      const response = await fetch(
        isEdit ? `/api/drivers/${initialDriver?.id}` : "/api/drivers",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) {
        setFailed(true);
        return;
      }
      const saved = (await response.json()) as DriverInfoDTO;
      onSaved(saved);
      if (!isEdit) {
        setForm(EMPTY_STATE);
        setErrors({});
      }
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  }

  const fieldError = (key: keyof DriverFieldErrors) =>
    errors[key] ? <p className="text-xs text-red-400">{errors[key]}</p> : null;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-5 rounded-xl border border-border bg-card/70 p-6 backdrop-blur"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`driverName-${idSuffix}`}>
            {t("fields.driverName")}
          </Label>
          <Input
            id={`driverName-${idSuffix}`}
            value={form.driverName}
            placeholder={t("fields.driverNamePlaceholder")}
            onChange={(event) => update({ driverName: event.target.value })}
          />
          {fieldError("driverName")}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`phone-${idSuffix}`}>{t("fields.phone")}</Label>
          <Input
            id={`phone-${idSuffix}`}
            value={form.phone}
            placeholder={t("fields.phonePlaceholder")}
            onChange={(event) => update({ phone: event.target.value })}
          />
          {fieldError("phone")}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`wechat-${idSuffix}`}>{t("fields.wechat")}</Label>
          <Input
            id={`wechat-${idSuffix}`}
            value={form.wechat}
            placeholder={t("fields.wechatPlaceholder")}
            onChange={(event) => update({ wechat: event.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t("fields.carType")}</Label>
          <Select
            value={form.carTypePreset}
            onValueChange={(value) => update({ carTypePreset: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("fields.carTypePlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {PRESET_CAR_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {t(`carTypes.${type}`)}
                </SelectItem>
              ))}
              <SelectItem value={CUSTOM_CAR_TYPE}>
                {t("fields.carTypeCustomOption")}
              </SelectItem>
            </SelectContent>
          </Select>
          {form.carTypePreset === CUSTOM_CAR_TYPE && (
            <Input
              value={form.carTypeCustom}
              placeholder={t("fields.carTypeCustomPlaceholder")}
              onChange={(event) =>
                update({ carTypeCustom: event.target.value })
              }
            />
          )}
          {fieldError("carType")}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`licensePlate-${idSuffix}`}>
            {t("fields.licensePlate")}
          </Label>
          <Input
            id={`licensePlate-${idSuffix}`}
            value={form.licensePlate}
            placeholder={t("fields.licensePlatePlaceholder")}
            onChange={(event) => update({ licensePlate: event.target.value })}
          />
          {fieldError("licensePlate")}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`carColor-${idSuffix}`}>
            {t("fields.carColor")}
          </Label>
          <Input
            id={`carColor-${idSuffix}`}
            value={form.carColor}
            placeholder={t("fields.carColorPlaceholder")}
            onChange={(event) => update({ carColor: event.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`opStart-${idSuffix}`}>
            {t("fields.operationStart")}
          </Label>
          <Input
            id={`opStart-${idSuffix}`}
            type="date"
            value={form.operationStartDate}
            onChange={(event) =>
              update({ operationStartDate: event.target.value })
            }
          />
          {fieldError("operationStartDate")}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`opEnd-${idSuffix}`}>
            {t("fields.operationEnd")}
          </Label>
          <Input
            id={`opEnd-${idSuffix}`}
            type="date"
            value={form.operationEndDate}
            onChange={(event) =>
              update({ operationEndDate: event.target.value })
            }
          />
          {fieldError("operationEndDate")}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`dailyStart-${idSuffix}`}>
            {t("fields.dailyStart")}
          </Label>
          <Input
            id={`dailyStart-${idSuffix}`}
            type="time"
            value={form.dailyAvailableStart}
            onChange={(event) =>
              update({ dailyAvailableStart: event.target.value })
            }
          />
          {fieldError("dailyAvailableStart")}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`dailyEnd-${idSuffix}`}>
            {t("fields.dailyEnd")}
          </Label>
          <Input
            id={`dailyEnd-${idSuffix}`}
            type="time"
            value={form.dailyAvailableEnd}
            onChange={(event) =>
              update({ dailyAvailableEnd: event.target.value })
            }
          />
          {fieldError("dailyAvailableEnd")}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`discountInfo-${idSuffix}`}>
          {t("fields.discount")}
        </Label>
        <Input
          id={`discountInfo-${idSuffix}`}
          value={form.discountInfo}
          placeholder={t("fields.discountPlaceholder")}
          onChange={(event) => update({ discountInfo: event.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`carRemark-${idSuffix}`}>{t("fields.carRemark")}</Label>
        <Textarea
          id={`carRemark-${idSuffix}`}
          rows={3}
          value={form.carRemark}
          placeholder={t("fields.carRemarkPlaceholder")}
          onChange={(event) => update({ carRemark: event.target.value })}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isEdit ? (
            <Save className="h-4 w-4" />
          ) : (
            <UserPlus className="h-4 w-4" />
          )}
          {saving
            ? isEdit
              ? t("actions.saving")
              : t("actions.adding")
            : isEdit
              ? t("actions.save")
              : t("actions.add")}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {t("actions.cancel")}
          </Button>
        )}
        {failed && <p className="text-sm text-red-400">{t("fail")}</p>}
      </div>
    </form>
  );
}
