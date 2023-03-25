import React, { useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { getSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import { useRouter } from "next/router";
import formatISO from "date-fns/formatISO";
import isPlainObject from "lodash/isPlainObject";
import omit from "lodash/omit";
import EventSetupHeader from "@/components/common/EventSetupHeader";
import PageHeader from "@/components/common/PageHeader";
import EventGeneralForm from "@/components/forms/EventGeneralForm";
import ViewEventLayout from "@/components/layouts/ViewEventLayout";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Panel from "@/components/ui/Panel";
import eventTypes from "@/constants/eventTypes";
import { useEventDispatch } from "@/contexts/EventContext";
import actionTypes from "@/contexts/action-types";
import paths from "@/routes/paths";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import api from "@/utils/api";
import { useToasts } from "react-toast-notifications";

const EventSetupGeneralDetail = ({ event, session }) => {
  const router = useRouter();
  const eventDispatch = useEventDispatch();
  const t = useTranslations();
  const { addToast } = useToasts();
  const [isSaving, setSaving] = React.useState(false);

  /**
   * Prepares the options for to be used by
   * multiple select fields.
   */
  const eventTypeOptions = eventTypes().map((type) => ({
    label: type,
    value: type,
  }));

  const methods = useForm({
    defaultValues: {
      ...event,
      type: event?.type
        ? eventTypeOptions.find((opt) => opt.value == event?.type)
        : undefined,
      venue: event?.venue
        ? { label: event?.venue?.name, value: event?.venue?.id }
        : undefined,
      primary_admin: event?.primary_admin
        ? {
            label: `${event?.primary_admin?.first_name} ${event?.primary_admin?.last_name}`,
            value: event?.primary_admin?.id,
          }
        : undefined,
      secondary_admin: event?.secondary_admin
        ? {
            label: `${event?.secondary_admin?.first_name} ${event?.secondary_admin?.last_name}`,
            value: event?.secondary_admin?.id,
          }
        : undefined,
      timezone: event?.timezone
        ? { label: event?.timezone, value: event?.timezone }
        : undefined,
      registration_timezone: event?.registration_timezone
        ? {
            label: event?.registration_timezone,
            value: event?.registration_timezone,
          }
        : undefined,
      event_dates: {
        from: event?.start_date ? new Date(event?.start_date) : undefined,
        to: event?.end_date ? new Date(event?.end_date) : undefined,
      },
      registration_dates: {
        from: event?.registration_open
          ? new Date(event?.registration_open)
          : undefined,
        to: event?.registration_end
          ? new Date(event?.registration_end)
          : undefined,
      },
      website: event?.website
        ? event?.website.replace(/^http:\/\//, "")
        : undefined,
    },
  });

  const handleUpdate = async (params) => {
    setSaving(true);
    let requestParams = {};
    const paramValues = omit(params, ["event_dates", "registration_dates"]);

    if (params.event_dates) {
      requestParams = {
        ...requestParams,
        start_date: formatISO(params.event_dates?.from),
        end_date: formatISO(params.event_dates?.to),
        registration_open: formatISO(params.registration_dates?.from),
        registration_end: formatISO(params.registration_dates?.to),
      };
    }

    for (const [key, value] of Object.entries(paramValues)) {
      /**
       * Check if its a select field's label-value pair object prop.
       * If it is, extract its value.
       */
      if (isPlainObject(value)) {
        requestParams = {
          ...requestParams,
          [key]: value.value,
        };
        /**
         * else, append it like nothing happened. :)
         */
      } else {
        requestParams = {
          ...requestParams,
          [key]: value,
        };
      }
    }

    requestParams = {
      ...requestParams,
      _method: "PUT",
    };

    api({
      url: `events/${event?.id}`,
      method: "POST",
      data: requestParams,
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "X-Tenant": getTenant(),
      },
    })
      .then((res) => {
        addToast("Event general details saved successfully", {
          appearance: "success",
          autoDismiss: true,
        });
        router.replace(router.asPath);
        /**

         * router.push({
          pathname: paths.ADMIN_EVT_SETUP_FINANCIAL,
          query: { eventId: event?.id },
        });
         */
      })
      .catch((err) => {
        addToast("Failed to save event general details.", {
          appearance: "error",
          autoDismiss: true,
        });
      })
      .finally(() => {
        setSaving(false);
      });
  };

  const pageHeaderToolbar = (
    <Button
      color="primary"
      isCircle
      onClick={methods.handleSubmit(handleUpdate)}
      isLoading={isSaving}
    >
      <Icon icon="save" type="far" className="mr-1" />
      {t("common.forms.saveChanges")}
    </Button>
  );

  /**
   * Sets the event to be used for the entire event-related pages.
   * This must be implemented in every event page.
   */
  useEffect(() => {
    eventDispatch({
      type: actionTypes.SET_EVENT,
      payload: event,
    });
  }, [event]);

  return (
    <>
      <PageHeader
        title="Edit Event"
        toolbar={pageHeaderToolbar}
        description={<EventSetupHeader />}
      />

      <Panel title="Edit Event Details" color="inverse" maximizable collapsable>
        <FormProvider {...methods}>
          <EventGeneralForm {...{ isSaving }} />
        </FormProvider>
      </Panel>
    </>
  );
};

export const getServerSideProps = async (context) => {
  const session = await getSession(context);

  if (session) {
    try {
      const response = await api({
        url: `/events/${context.params.eventId}`,
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(context.req),
        },
      });

      return {
        props: {
          session,
          context: await getContextProps(context),
          event: response.data.data,
        },
      };
    } catch (err) {
      return {
        notFound: true,
      };
    }
  }
};

EventSetupGeneralDetail.Layout = ViewEventLayout;

export default EventSetupGeneralDetail;
