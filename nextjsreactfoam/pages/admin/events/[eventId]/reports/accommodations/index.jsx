import { useState, useEffect } from "react";
import * as React from "react";
import { getSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import queryString from "query-string";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import EventAccommodationList from "@/components/forPage/EventAccommodationList";
import ViewEventLayout from "@/components/layouts/ViewEventLayout";
import { useEventDispatch } from "@/contexts/EventContext";
import actionTypes from "@/contexts/action-types";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import api from "@/utils/api";
import AccommodationsReportHeader from "@/components/common/AccommodationsReportHeader";
import AccommodationModal from "@/components/modals/AccommodationModal";
import PopupAlert from "@/components/ui/PopupAlert";
import requestParamBuilder from "@/utils/requestParamBuilder";
import { useToasts } from "react-toast-notifications";

const AccommodationReport = ({
  event,
  sponsors,
  meta,
  context,
  accommodationList,
}) => {
  const { addToast } = useToasts();
  const t = useTranslations();
  const eventDispatch = useEventDispatch();
  const initialNumOfEntries = context.query.perPage;
  const [isSaving, setSaving] = useState(false);
  const [
    isAddAccommodationModalOpen,
    setIsAddAccommodationModalOpen,
  ] = React.useState(false);
  const [isEditAccommodation, setIsEditAccommodation] = React.useState(false);
  const [toEditAccommodation, setToEditAccommodation] = useState();
  const [toDeleteAccommodation, setToDeleteAccommodation] = useState();
  const [showConfirmation, setShowConfirmation] = useState(false);

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

  const handlePageChange = ({ selected }) => {
    router.query.page = selected;
    router.push(router);
  };

  const handleKeywordChange = (keyword) => {
    router.query.keyword = keyword;
    router.push(router);
  };

  const refreshData = () => {
    router.replace(router.asPath);
  };

  const handleEdit = (item) => {
    setIsEditAccommodation(item);
    setToEditAccommodation(item);

    setIsAddAccommodationModalOpen(true);
  };

  const handleDelete = (id) => {
    setShowConfirmation(true);
    setToDeleteAccommodation(id);
  };

  const onConfirmDelete = async () => {
    setSaving(true);

    try {
      const session = await getSession();

      await api({
        url: `/events/${event.id}/accommodation-rooms/${toDeleteAccommodation}`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(context.req),
        },
      });

      addToast("Accommodation deleted successfully.", {
        appearance: "success",
        autoDismiss: true,
      });

      setShowConfirmation(false);

      refreshData();
    } catch (e) {
      addToast("Failed to delete accommodation.", {
        appearance: "error",
        autoDismiss: true,
      });
    } finally {
      setSaving(false);
      setToDeleteAccommodation(undefined);
    }
  };

  const onEdit = async (data) => {
    try {
      const requestParams = requestParamBuilder(data);
      const session = await getSession();

      await api({
        url: `/events/${event.id}/accommodation-rooms/${toEditAccommodation.id}`,
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(context.req),
        },
        data: requestParams,
      });

      addToast("Accommodation updated successfully.", {
        appearance: "success",
        autoDismiss: true,
      });

      setIsAddAccommodationModalOpen(false);

      refreshData();
    } catch (e) {
      addToast("Failed to update accommodation.", {
        appearance: "error",
        autoDismiss: true,
      });
    } finally {
      setSaving(false);
      setIsEditAccommodation(false);
      setToEditAccommodation(undefined);
    }
  };

  return (
    <ContentErrorBoundary>
      <AccommodationsReportHeader />
      <EventAccommodationList
        items={accommodationList}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
      />
      {isAddAccommodationModalOpen && (
        <AccommodationModal
          onSubmit={isEditAccommodation ? onEdit : onSubmit}
          isEditing={isEditAccommodation}
          isShow={isAddAccommodationModalOpen}
          onHide={() => {
            setIsAddAccommodationModalOpen(false);
            setIsEditAccommodation(false);
            setToEditAccommodation(undefined);
          }}
          defaultValues={toEditAccommodation}
          isSaving={isSaving}
        />
      )}
      {showConfirmation && (
        <PopupAlert
          danger
          showCancel
          confirmBtnText="Delete"
          confirmBtnBsStyle="danger"
          title="Delete Confirmation"
          focusCancelBtn
          onConfirm={onConfirmDelete}
          onCancel={() => {
            setToDeleteAccommodation();
            setShowConfirmation(false);
          }}
        >
          Are you sure you want to delete this Accommodation?
        </PopupAlert>
      )}
    </ContentErrorBoundary>
  );
};

export async function getServerSideProps(context) {
  const session = await getSession(context);
  const parsedQueryString = queryString.parse(context.req.url.split("?")[1]);
  const urlQueryString = queryString.stringify({
    ...parsedQueryString,
    page: context.query.page || 1,
  });

  const headers = {
    Authorization: `Bearer ${session.accessToken}`,
    "X-Tenant": getTenant(context.req),
  };

  if (session) {
    try {
      const eventResponse = await api({
        url: `/events/${context.params.eventId}?withBasicStats=1`,
        headers,
      });
      const accommodationListResponse = await api({
        url: `/events/${context.params.eventId}/accommodation-rooms`,
        headers,
      });

      return {
        props: {
          session,
          context: await getContextProps(context),
          event: eventResponse.data.data,
          accommodationList: accommodationListResponse.data.data,
        },
      };
    } catch (err) {
      return {
        notFound: true,
      };
    }
  }
}

AccommodationReport.Layout = ViewEventLayout;

export default AccommodationReport;
