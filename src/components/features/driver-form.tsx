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

const CAR_TYPES: ReadonlyArray<CarType> = ["sedan", "suv", "mpv"];

interface DriverFormState {
  driverName: string;
  phone: string;
  wechat: string;
  licensePlate: string;
  operationStartDate: string;
  operationEndDate: string;
  dailyAvailableStart: string;
  dailyAvailableEnd: string;
  pricePerPerson: string;
  carType: CarType | "";
  carRemark: string;
}

const EMPTY_STATE: DriverFormState = {
  driverName: "",
  phone: "",
  wechat: "",
  licensePlate: "",
  operationStartDate: "",
  operationEndDate: "",
  dailyAvailableStart: "",
  dailyAvailableEnd: "",
  pricePerPerson: "",
  carType: "",
  carRemark: "",
};

type DriverFieldErrors = Partial<Record<keyof DriverFormState, string>>;

function stateFromDriver(driver: DriverInfoDTO): DriverFormState {
  return {
    driverName: driver.driverName,
    phone: driver.phone,
    wechat: driver.wechat ?? "",
    licensePlate: driver.licensePlate,
    operationStartDate: driver.operationStartDate.slice(0, 10),
    operationEndDate: driver.operationEndDate.slice(0, 10),
    dailyAvailableStart: driver.dailyAvailableStart,
    dailyAvailableEnd: driver.dailyAvailableEnd,
    pricePerPerson: String(Number(driver.pricePerPerson)),
    carType: driver.carType,
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

  const update = (patch: Partial<DriverFormState>) => {
    setForm((current) => ({ ...current, ...patch }));
  };

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
    const price = Number(form.pricePerPerson);
    if (form.pricePerPerson === "" || Number.isNaN(price) || price < 0) {
      next.pricePerPerson = t("errors.price");
    }
    if (!form.carType) next.carType = t("errors.required");
    return next;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFailed(false);
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || form.carType === "") return;

    const payload: DriverPayload = {
      driverName: form.driverName.trim(),
      phone: form.phone.trim(),
      wechat: form.wechat.trim() || undefined,
      licensePlate: form.licensePlate.trim(),
      operationStartDate: form.operationStartDate,
      operationEndDate: form.operationEndDate,
      dailyAvailableStart: form.dailyAvailableStart,
      dailyAvailableEnd: form.dailyAvailableEnd,
      pricePerPerson: Number(form.pricePerPerson),
      carType: form.carType,
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
          <Label htmlFor={`driverName-${initialDriver?.id ?? "new"}`}>
            {t("fields.driverName")}
          </Label>
          <Input
            id={`driverName-${initialDriver?.id ?? "new"}`}
            value={form.driverName}
            placeholder={t("fields.driverNamePlaceholder")}
            onChange={(event) => update({ driverName: event.target.value })}
          />
          {fieldError("driverName")}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`phone-${initialDriver?.id ?? "new"}`}>
            {t("fields.phone")}
          </Label>
          <Input
            id={`phone-${initialDriver?.id ?? "new"}`}
            value={form.phone}
            placeholder={t("fields.phonePlaceholder")}
            onChange={(event) => update({ phone: event.target.value })}
          />
          {fieldError("phone")}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`wechat-${initialDriver?.id ?? "new"}`}>
            {t("fields.wechat")}
          </Label>
          <Input
            id={`wechat-${initialDriver?.id ?? "new"}`}
            value={form.wechat}
            placeholder={t("fields.wechatPlaceholder")}
            onChange={(event) => update({ wechat: event.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`licensePlate-${initialDriver?.id ?? "new"}`}>
            {t("fields.licensePlate")}
          </Label>
          <Input
            id={`licensePlate-${initialDriver?.id ?? "new"}`}
            value={form.licensePlate}
            placeholder={t("fields.licensePlatePlaceholder")}
            onChange={(event) => update({ licensePlate: event.target.value })}
          />
          {fieldError("licensePlate")}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`opStart-${initialDriver?.id ?? "new"}`}>
            {t("fields.operationStart")}
          </Label>
          <Input
            id={`opStart-${initialDriver?.id ?? "new"}`}
            type="date"
            value={form.operationStartDate}
            onChange={(event) =>
              update({ operationStartDate: event.target.value })
            }
          />
          {fieldError("operationStartDate")}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`opEnd-${initialDriver?.id ?? "new"}`}>
            {t("fields.operationEnd")}
          </Label>
          <Input
            id={`opEnd-${initialDriver?.id ?? "new"}`}
            type="date"
            value={form.operationEndDate}
            onChange={(event) =>
              update({ operationEndDate: event.target.value })
            }
          />
          {fieldError("operationEndDate")}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`dailyStart-${initialDriver?.id ?? "new"}`}>
            {t("fields.dailyStart")}
          </Label>
          <Input
            id={`dailyStart-${initialDriver?.id ?? "new"}`}
            type="time"
            value={form.dailyAvailableStart}
            onChange={(event) =>
              update({ dailyAvailableStart: event.target.value })
            }
          />
          {fieldError("dailyAvailableStart")}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`dailyEnd-${initialDriver?.id ?? "new"}`}>
            {t("fields.dailyEnd")}
          </Label>
          <Input
            id={`dailyEnd-${initialDriver?.id ?? "new"}`}
            type="time"
            value={form.dailyAvailableEnd}
            onChange={(event) =>
              update({ dailyAvailableEnd: event.target.value })
            }
          />
          {fieldError("dailyAvailableEnd")}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`price-${initialDriver?.id ?? "new"}`}>
            {t("fields.price")}
          </Label>
          <Input
            id={`price-${initialDriver?.id ?? "new"}`}
            type="number"
            min="0"
            step="0.01"
            value={form.pricePerPerson}
            placeholder={t("fields.pricePlaceholder")}
            onChange={(event) =>
              update({ pricePerPerson: event.target.value })
            }
          />
          {fieldError("pricePerPerson")}
        </div>
        <div className="space-y-1.5">
          <Label>{t("fields.carType")}</Label>
          <Select
            value={form.carType}
            onValueChange={(value) => update({ carType: value as CarType })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("fields.carTypePlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {CAR_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {t(`carTypes.${type}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldError("carType")}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`carRemark-${initialDriver?.id ?? "new"}`}>
          {t("fields.carRemark")}
        </Label>
        <Textarea
          id={`carRemark-${initialDriver?.id ?? "new"}`}
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
