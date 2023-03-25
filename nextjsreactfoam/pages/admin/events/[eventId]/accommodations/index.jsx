import React, { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { getSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import { useToasts } from "react-toast-notifications";
import { useRouter } from "next/router";
import { omit } from "lodash";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import ManageAccommodationSettings from "@/components/forPage/EventManageAccomodation/ManageAccommodationSettings";
import PageHeader from "@/components/common/PageHeader";
import ViewEventLayout from "@/components/layouts/ViewEventLayout";
import GeneralAccommodationModal from "@/components/modals/GeneralAccommodationModal";
import { useEventDispatch } from "@/contexts/EventContext";
import actionTypes from "@/contexts/action-types";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import useLocalTimezone from "@/hooks/useLocalTimezone";
import { timezoneOptions } from "@/options";
import { createAccommodation } from "@/requests/accommodations";
import apiPaths from "@/routes/api";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import interpolatePath from "@/utils/interpolatePath";
import requestParamBuilder from "@/utils/requestParamBuilder";
import setDefaultValues, { DATEPICKER, OPTION } from "@/utils/setDefaultValues";

const Accommodations = ({
  event,
  sponsors,
  meta,
  context,
  session,
  headers,
}) => {
  const localTimezone = useLocalTimezone();
  const router = useRouter();
  const t = useTranslations();
  const eventDispatch = useEventDispatch();
  const { addToast } = useToasts();
  const [showAddHotelModal, setShowAddHotelModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const methods = useForm({
    defaultValues: setDefaultValues(
      {
        ...event,
        accommodation_end_timezone:
          event?.accommodation_end_timezone || localTimezone,
        wotif_accommodation_end_timezone:
          event?.wotif_accommodation_end_timezone || localTimezone,
        accommodation_text:
          event?.accommodation_text ||
          t("common.forms.defaultValues.manageAccommodationIntroduction"),
      },
      {
        accommodation_end: { type: DATEPICKER },
        accommodation_end_timezone: { type: OPTION, options: timezoneOptions },
        wotif_accommodation_end: { type: DATEPICKER },
        wotif_accommodation_end_timezone: {
          type: OPTION,
          options: timezoneOptions,
        },
      }
    ),
  });

  useEffect(() => {
    eventDispatch({
      type: actionTypes.SET_EVENT,
      payload: event,
    });
  }, [event]);

  const refreshData = () => {
    router.replace(router.asPath);
  };

  const onSaveChanges = async (accommodationDetailsData) => {
    const requestBody = requestParamBuilder(
      omit(accommodationDetailsData, ["managed_accommodation"])
    );

    try {
      await api({
        headers,
        method: "PUT",
        url: interpolatePath(apiPaths.EVT, { eventId: event.id }),
        data: requestBody,
      });

      addToast("Manage accommodation details successfully saved.", {
        appearance: "success",
        autoDismiss: true,
      });

      refreshData();
    } catch (e) {
      addToast(
        "Failed to save manage accommodation details. Please try again.",
        {
          appearance: "error",
          autoDismiss: true,
        }
      );
    }
  };

  const handleHotelSubmit = async (params) => {
    setIsLoading(true);

    try {
      await createAccommodation(params, session.accessToken);

      addToast(
        t("common.notifs.successfullyCreated", {
          entityName: "",
          entity: t("common.hotel", { entries: 1 }),
        }),
        {
          appearance: "success",
          autoDismiss: true,
        }
      );

      refreshData();
    } catch (err) {
      addToast(err?.message ? err?.message : "Failed to save hotel details.", {
        appearance: "error",
        autoDismiss: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const pageHeaderToolbar = (
    <>
      <Button
        color="primary"
        onClick={() => setShowAddHotelModal(true)}
        isRounded
      >
        <Icon icon="plus" className="mr-1" />
        {t("common.buttons.addVenue")}
      </Button>
      <Button
        color="secondary"
        className="ml-1"
        onClick={() => methods.handleSubmit(onSaveChanges)()}
        isRounded
      >
        <Icon icon="plus" className="mr-1" />
        {t("common.forms.saveChanges")}
      </Button>
    </>
  );

  return (
    <ContentErrorBoundary>
      {showAddHotelModal && (
        <GeneralAccommodationModal
          title="Add Hotel"
          isSaving={isLoading}
          isShow={showAddHotelModal}
          onSubmit={handleHotelSubmit}
          onHide={() => setShowAddHotelModal(false)}
        />
      )}
      <PageHeader
        subtitle={event?.short_name}
        tooltip={t("common.forms.tooltips.enableManageAccommodation")}
        toolbar={pageHeaderToolbar}
        title={t("common.forms.manageEntity", {
          entity: t("common.accommodation", { entries: 2 }),
        })}
      />
      <FormProvider {...methods}>
        <ManageAccommodationSettings {...{ event }} />
      </FormProvider>
    </ContentErrorBoundary>
  );
};

export async function getServerSideProps(context) {
  const session = await getSession(context);

  if (session) {
    const headers = {
      Authorization: `Bearer ${session.accessToken}`,
      "X-Tenant": getTenant(context.req),
    };

    try {
      const eventResponse = await api({
        headers,
        url: interpolatePath(apiPaths.EVT, { eventId: context.params.eventId }),
      });

      return {
        props: {
          session,
          headers,
          context: await getContextProps(context),
          event: eventResponse.data.data,
        },
      };
    } catch (err) {
      return {
        notFound: true,
      };
    }
  }

  return {
    notFound: true,
  };
}

Accommodations.Layout = ViewEventLayout;

export default Accommodations;
