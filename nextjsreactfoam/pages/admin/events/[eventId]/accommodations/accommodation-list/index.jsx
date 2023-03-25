import { useState, useEffect } from "react";
import * as React from "react";
import { getSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import queryString from "query-string";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import PageHeader from "@/components/common/PageHeader";
import ViewEventLayout from "@/components/layouts/ViewEventLayout";
import { useEventDispatch } from "@/contexts/EventContext";
import actionTypes from "@/contexts/action-types";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import api from "@/utils/api";
import PopupAlert from "@/components/ui/PopupAlert";
import { useRouter } from "next/router";
import { useToasts } from "react-toast-notifications";
import AccommodationModal from "@/components/modals/AccommodationModal";
import EventAccommodationAllocationModal from "@/components/modals/EventAccommodationAllocationModal";
import requestParamBuilder from "@/utils/requestParamBuilder";
import Link from "next/link";
import localizeDate from "@/utils/localizeDate";
import paths from "@/routes/paths";
import { format } from "date-fns";

const AccommodationList = ({ event, context, accommodationList }) => {
  const { addToast } = useToasts();
  const router = useRouter();
  const t = useTranslations();
  const eventDispatch = useEventDispatch();
  const [isSaving, setSaving] = useState(false);
  const [isAccommodationModalOpen, setIsAccommodationModalOpen] =
    React.useState(false);
  const [toEditAccommodation, setToEditAccommodation] = useState();
  const [toEditAllocation, setToEditAllocation] = useState();
  const [bookingDate, setBookingDate] = useState(undefined);
  const [toDeleteAccommodation, setToDeleteAccommodation] = useState();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [toBookModal, setToBookModal] = useState(false);
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

  const refreshData = () => {
    router.replace(router.asPath);
  };

  const pageHeaderToolbar = (
    <Button
      color="primary"
      isCircle
      onClick={() => {
        setIsAccommodationModalOpen(true);
        setToEditAccommodation();
      }}
    >
      <Icon icon="plus" classNameName="mr-1" />{" "}
      {t("common.forms.addNewEntity", {
        entity: t("common.accommodation", { entries: 1 }),
      })}
    </Button>
  );

  const handleEdit = (item) => {
    setToEditAccommodation(item);
    setIsAccommodationModalOpen(true);
  };

  const handleDelete = (id) => {
    setShowConfirmation(true);
    setToDeleteAccommodation(id);
  };

  const onConfirmDelete = async () => {
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

      setToDeleteAccommodation(undefined);
      setShowConfirmation(false);
    } catch (e) {
      addToast("Failed to delete accommodation.", {
        appearance: "error",
        autoDismiss: true,
      });
    } finally {
      setSaving(false);

      refreshData();
    }
  };

  const onSubmit = async (data) => {
    setSaving(true);

    try {
      const requestParams = requestParamBuilder(data);
      const session = await getSession();

      await api({
        url: `/events/${event.id}/accommodation-rooms`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(context.req),
        },
        data: requestParams,
      });

      addToast("Accommodation added successfully.", {
        appearance: "success",
        autoDismiss: true,
      });

      refreshData();
    } catch (e) {
      addToast(e?.response?.data?.error || "Failed to add accommodation.", {
        appearance: "error",
        autoDismiss: true,
      });
    } finally {
      setSaving(false);
      setIsAccommodationModalOpen(false);
    }
  };

  const onEdit = async (data) => {
    setSaving(true);
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

      refreshData();
    } catch (e) {
      addToast("Failed to update accommodation.", {
        appearance: "error",
        autoDismiss: true,
      });
    } finally {
      setSaving(false);
      setIsAccommodationModalOpen(false);
    }
  };

  const onSubmitAllocation = async (data) => {
    setSaving(true);
    try {
      const requestParams = requestParamBuilder(data);
      const session = await getSession();

      await api({
        url: `/events/${event.id}/accommodation-allocation-rooms/${toEditAllocation.id}`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(context.req),
        },
        data: requestParams,
      });

      addToast("Allocation added successfully.", {
        appearance: "success",
        autoDismiss: true,
      });

      refreshData();
    } catch (e) {
      addToast(e?.response?.data?.error || "Failed to add Allocation.", {
        appearance: "error",
        autoDismiss: true,
      });
    } finally {
      setSaving(false);
      setToBookModal(false);
    }
  };

  const onEditAllocation = async (data) => {
    setSaving(true);
    try {
      const requestParams = requestParamBuilder(data);
      const session = await getSession();

      await api({
        url: `/events/${event.id}/accommodation-allocation-rooms/${toEditAllocation?.id}`,
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(context.req),
        },
        data: { ...requestParams, accommodation: toEditAllocation },
      });

      addToast("Allocation updated successfully.", {
        appearance: "success",
        autoDismiss: true,
      });

      refreshData();
    } catch (e) {
      addToast("Failed to update Allocation.", {
        appearance: "error",
        autoDismiss: true,
      });
    } finally {
      setSaving(false);
      setToBookModal(false);
    }
  };

  const onDeleteAllocation = async (bookingDate) => {
    try {
      const session = await getSession();

      await api({
        url: `/events/${event.id}/accommodation-allocation-rooms/${toEditAllocation?.id}`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(context.req),
        },
        data: { booking_date: bookingDate },
      });

      addToast("Allocation/Cost deleted successfully.", {
        appearance: "success",
        autoDismiss: true,
      });

      setToBookModal(false);
      refreshData();
    } catch (e) {
      addToast("Failed to delete Allocation/Cost.", {
        appearance: "error",
        autoDismiss: true,
      });
    } finally {
      setSaving(false);
      setToBookModal(false);
    }
  };

  const getBgColor = (allocation, bookingCount, disabled) => {
    if (disabled) {
      return "bg-danger";
    }

    if (allocation !== null && allocation > 0) {
      return "bg-green";
    }

    return "bg-grey";
  };

  return (
    <ContentErrorBoundary>
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
      {toBookModal && (
        <EventAccommodationAllocationModal
          isShow={toBookModal}
          onHide={() => {
            setToBookModal(false);
            setBookingDate(undefined);
            setToEditAllocation(undefined);
          }}
          onSubmit={bookingDate ? onEditAllocation : onSubmitAllocation}
          onDelete={onDeleteAllocation}
          accommodation={toEditAllocation}
          bookingDate={bookingDate}
        />
      )}
      {isAccommodationModalOpen && (
        <AccommodationModal
          isShow={isAccommodationModalOpen}
          onHide={() => {
            setIsAccommodationModalOpen(false);
          }}
          onSubmit={toEditAccommodation ? onEdit : onSubmit}
          defaultValues={toEditAccommodation}
        />
      )}
      <PageHeader
        title="Accommodation List "
        subtitle={event?.short_name}
        toolbar={(event?.managed_accommodation && pageHeaderToolbar) || null}
      />
      <ul className="result-list">
        {accommodationList?.map((accommodation) => (
          <li>
            <div className="result-info">
              <div className="row">
                <div className="col-md-4">
                  <h4 className="title">
                    <Link
                      href={{
                        pathname: paths.ADMIN_EVT_ACCOMMODATION_ITEM,
                        query: {
                          eventId: event.id,
                          accommodationId: accommodation.id,
                        },
                      }}
                    >
                      {`${accommodation?.accommodation_room?.accommodation?.name} - ${accommodation?.accommodation_room?.name}`}
                    </Link>
                  </h4>
                  <p className="mt-1 mb-1">
                    {t("common.roomType")}: <b>{accommodation?.room_type}</b> |
                    {t("common.roomName")}: <b>{accommodation?.room_name}</b>{" "}
                  </p>
                  <p className="mt-1 mb-1">
                    % {t("common.commission")}:{" "}
                    <b>{accommodation?.commission}</b> |{" "}
                    {t("common.accommodationCloses")}:{" "}
                    <b>{localizeDate(event?.accommodation_end)}</b>
                  </p>
                  <p className="mt-1 mb-1">
                    {t("common.distanceToVenue")}:{" "}
                    <b>{accommodation?.distance_to_venue}</b>
                  </p>
                  <p className="location">
                    {t("common.address")}:{" "}
                    <b>
                      {
                        accommodation?.accommodation_room?.accommodation
                          ?.address
                      }
                    </b>
                  </p>

                  <p className="desc">{accommodation?.description}</p>
                  <div className="btn-row">
                    {accommodation?.accommodation_addons?.map((addon) => (
                      <span className="btn btn-sm btn-indigo m-2">
                        {addon.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="col-md-8">
                  <div className="table-responsive ">
                    <table className="table table-bordered">
                      <thead className="text-center">
                        <tr>
                          {accommodation?.bookings_dates?.map(
                            (bookingDates) => {
                              if (bookingDates != null) {
                                return (
                                  <th width="1%">
                                    {format(
                                      new Date(bookingDates),
                                      "dd/MM/yyyy"
                                    )}
                                  </th>
                                );
                              }
                            }
                          )}
                        </tr>
                      </thead>
                      <tbody className="text-center">
                        <tr>
                          {accommodation?.bookings_dates?.map((bookingDate) => {
                            const allocation =
                              accommodation?.accommodation_allocation.find(
                                (element) => element.booking_date == bookingDate
                              );

                            const cost =
                              accommodation?.event_accommodation_costs.find(
                                (element) => element.booking_date == bookingDate
                              );
                            return (
                              bookingDate !== null && (
                                <td>
                                  {allocation && (
                                    <Button
                                      className={`badge p-5 ${getBgColor(
                                        allocation?.allocation,
                                        allocation?.bookings_count
                                      )} text-white`}
                                      onClick={() => {
                                        setBookingDate(bookingDate);
                                        setToBookModal(true);
                                        setToEditAllocation(accommodation);
                                      }}
                                    >
                                      {allocation?.bookings_count || 0} /{" "}
                                      {allocation?.allocation || 0}
                                    </Button>
                                  )}
                                  <br />
                                  {cost && (
                                    <Button
                                      className="badge p-5 bg-yellow text-black"
                                      onClick={() => {
                                        setBookingDate(bookingDate);
                                        setToBookModal(true);
                                        setToEditAllocation(accommodation);
                                      }}
                                    >
                                      {cost?.cost} {cost?.currency}
                                    </Button>
                                  )}
                                </td>
                              )
                            );
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <div className="result-price">
              {`${event.currency || "$"} ${accommodation?.price_per_night}`}{" "}
              <small>{t("common.defaultPerNight")}</small>
              <Button
                className="btn btn-green btn-block mt-4 mb-0"
                color="primary"
                isCircle
                onClick={() => {
                  setToBookModal(true);
                  setToEditAllocation(accommodation);
                }}
              >
                {t("common.buttons.addAllocationCost")}
              </Button>
              <Button
                className="btn btn-yellow btn-block mt-2 mb-0"
                color="primary"
                isCircle
                onClick={() => {
                  handleEdit(accommodation);
                }}
              >
                {t("common.buttons.editRoom")}
              </Button>
              <Button
                className="btn btn-danger btn-block  mt-2 mb-1"
                color="primary"
                isCircle
                onClick={() => {
                  handleDelete(accommodation.id);
                }}
              >
                {t("common.buttons.delete")}
              </Button>
            </div>
          </li>
        ))}
      </ul>
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
        url: `/events/${context.params.eventId}/accommodation-rooms?${urlQueryString}`,
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

AccommodationList.Layout = ViewEventLayout;

export default AccommodationList;
