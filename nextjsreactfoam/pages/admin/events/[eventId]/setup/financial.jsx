import React, { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { getSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import { useRouter } from "next/router";
import isPlainObject from "lodash/isPlainObject";
import omit from "lodash/omit";
import EventSetupHeader from "@/components/common/EventSetupHeader";
import PageHeader from "@/components/common/PageHeader";
import EventFinancialForm from "@/components/forms/EventFinancialForm";
import ViewEventLayout from "@/components/layouts/ViewEventLayout";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Panel from "@/components/ui/Panel";
import { useEventDispatch } from "@/contexts/EventContext";
import actionTypes from "@/contexts/action-types";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import api from "@/utils/api";
import paramsSanitizer from "@/utils/paramsSanitizer";
import { useToasts } from "react-toast-notifications";

const EventSetupFinancialDetail = ({ event, session }) => {
  const eventDispatch = useEventDispatch();
  const t = useTranslations();
  const router = useRouter();
  const { addToast } = useToasts();
  const methods = useForm({ defaultValues: event });
  const [isSaving, setSaving] = useState(false);

  const handleUpdate = async (params) => {
    setSaving(true);
    let formData = new FormData();
    const paramValues = omit(params, ["discount_codes"]);

    for (const [key, value] of Object.entries(paramValues)) {
      /**
       * Check if its a select field's label-value pair object prop.
       * If it is, extract its value.
       */
      if (isPlainObject(value)) {
        formData.append(key, value.value);
        /**
         * else, append it like nothing happened. :)
         */
      } else {
        formData.append(key, value);
      }
    }

    if (params.discount_codes) {
      if (params.discount_codes.length > 0) {
        params.discount_codes.forEach((code, index) => {
          let codeParams = code;
          if (isNaN(code.id)) {
            codeParams = omit(codeParams, ["id"]);
          }
          for (const [key, value] of Object.entries(
            paramsSanitizer(codeParams)
          )) {
            formData.append(`discount_codes[${index}][${key}]`, value);
          }
        });
      } else {
        formData.append(`discount_codes`, []);
      }
    }

    formData.append("_method", "PUT");

    api({
      url: `events/${event?.id}`,
      method: "POST",
      data: formData,
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "X-Tenant": getTenant(),
        "Content-Type": "multipart/form-data",
      },
    })
      .then((res) => {
        addToast("Event financial details saved successfully", {
          appearance: "success",
          autoDismiss: true,
        });
        router.replace(router.asPath);
        /**
         for forwording
        *  router.push({
          pathname: paths.ADMIN_EVT_SETUP_CUSTOMISATION,
          query: { eventId: event?.id },
        });

        */
      })
      .catch((err) => {
        addToast("Failed to save event financial details.", {
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

      <Panel
        title="Edit Event Financial Details"
        color="inverse"
        maximizable
        collapsable
      >
        <FormProvider {...methods}>
          <EventFinancialForm
            persistData={event}
            setPersistData={() => {}}
            isSaving={isSaving}
          />
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

EventSetupFinancialDetail.Layout = ViewEventLayout;

export default EventSetupFinancialDetail;
