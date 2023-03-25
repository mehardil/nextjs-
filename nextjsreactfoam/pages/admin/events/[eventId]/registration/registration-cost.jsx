import React, { useState, useEffect } from "react";
import ViewEventLayout from "@/components/layouts/ViewEventLayout";
import { getSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import { useRouter } from "next/router";
import { useToasts } from "react-toast-notifications";
import queryString from "query-string";
import capitalize from "lodash/capitalize";
import isPlainObject from "lodash/isPlainObject";
import map from "lodash/map";
import uniqBy from "lodash/uniqBy";
import classNames from "classnames";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import PageHeader from "@/components/common/PageHeader";
import RegistrationTimeframeCostsColumn from "@/components/common/RegistrationTimeframeCostsColumn";
import EventItemModal from "@/components/modals/EventItemModal";
import EventItemCostModal from "@/components/modals/EventItemCostModal";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Panel from "@/components/ui/Panel";
import Pill from "@/components/ui/Pill";
import PopupAlert from "@/components/ui/PopupAlert";
import Table from "@/components/ui/Table";
import Tooltip from "@/components/ui/Tooltip";
import EventTimeFrameModal from "@/components/modals/EventTimeFrameModal";
import actionTypes from "@/contexts/action-types";
import { useEventDispatch } from "@/contexts/EventContext";
import RegistrationTimeFrameModal from "@/components/modals/RegistrationTimeFrameModal";
import getContextProps from "@/utils/getContextProps";
import formatISO from "date-fns/formatISO";
import api from "@/utils/api";
import getTenant from "@/utils/getTenant";

const RegistrationCosts = ({ event, timeframes, attendeeTypes, session }) => {
  const t = useTranslations();
  const router = useRouter();
  const { addToast } = useToasts();
  const eventDispatch = useEventDispatch();
  const [isSaving, setSaving] = useState(false);
  const [isShowEventItemModal, setShowEventItemModal] = useState(false);
  const [activeAttendeeType, setActiveAttendeeType] = useState();
  const [activeEventItem, setActiveEventItem] = useState();
  const [isShowConfirmItemDelete, setShowConfirmItemDelete] = useState(false);
  const [isEventItemDeleting, setEventItemDeleting] = useState(false);
  const [isShowEventItemCostModal, setShowEventItemCostModal] = useState(false);
  const [activeItemCost, setActiveItemCost] = useState();
  const [isSavingItemCost, setSavingItemCost] = useState(false);

  let tableColumns = [
    { key: "type", label: "Attendee Category", _style: { width: "20%" } },
    { key: "event_items", label: "Type", _style: { width: "15%" } },
    { key: "timeframe_regular", label: "Regular" },
  ];

  timeframes.forEach((timeframe) => {
    tableColumns = tableColumns.concat([
      { key: `timeframe_${timeframe.id}`, label: timeframe.name },
    ]);
  });

  let scopedSlots = {
    type: (attendeeType) => (
      <td className="position-relative">
        <span>{attendeeType.type}</span>
        <div
          className="position-absolute"
          style={{ bottom: "8px", right: "12px" }}
        >
          <Button
            size="xs"
            color="primary"
            className="align-self-baseline"
            isCircle
            isCenter
            isIcon
            onClick={() => {
              setActiveAttendeeType(attendeeType);
              setShowEventItemModal(true);
            }}
          >
            <Icon icon="plus"></Icon>
          </Button>
        </div>
      </td>
    ),
    event_items: ({ costs, ...attendeeType }) => {
      const eventItems = uniqBy(map(costs, "event_item"), (item) => item.id);
      return (
        <td className="p-0" rowSpan={1}>
          {eventItems.map((item, index) => {
            return (
              <tr
                key={item?.id}
                className={classNames("width-full d-block", {
                  "b-b-1": eventItems?.length != index + 1,
                })}
              >
                <td className="b-0 d-flex">
                  <div
                    className="flex-grow-1 text-left pl-2"
                    style={{
                      width: "150px",
                      textOverflow: "ellipsis",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Tooltip message={item.name}>{item.name}</Tooltip>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <Button
                      size="xs"
                      color="secondary"
                      isCircle
                      isIcon
                      onClick={() => {
                        setActiveAttendeeType(attendeeType);
                        setActiveEventItem(item);
                        setShowEventItemModal(true);
                      }}
                    >
                      <Icon icon="edit" />
                    </Button>
                    <Button
                      size="xs"
                      color="danger"
                      className="ml-1"
                      isCircle
                      isIcon
                      onClick={() => {
                        setActiveEventItem(item);
                        setShowConfirmItemDelete(true);
                      }}
                    >
                      <Icon icon="times" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </td>
      );
    },
    timeframe_regular: ({ costs }) => {
      const eventItems = uniqBy(map(costs, "event_item"), (item) => item.id);
      return (
        <td className="p-0">
          <RegistrationTimeframeCostsColumn
            eventItems={eventItems}
            costs={costs}
            currency={event?.currency}
            onEdit={(itemCost) => {
              setActiveItemCost(itemCost);
              setShowEventItemCostModal(true);
            }}
          />
        </td>
      );
    },
  };

  timeframes.forEach((timeframe) => {
    scopedSlots = Object.assign(scopedSlots, {
      [`timeframe_${timeframe.id}`]: ({ costs }) => {
        const eventItems = uniqBy(map(costs, "event_item"), (item) => item.id);
        return (
          <td className="p-0">
            <RegistrationTimeframeCostsColumn
              timeframe={timeframe}
              eventItems={eventItems}
              costs={costs}
              currency={event?.currency}
              onEdit={(itemCost) => {
                setActiveItemCost(itemCost);
                setShowEventItemCostModal(true);
              }}
            />
          </td>
        );
      },
    });
  });

  /**
   * Performs the create and update events of the
   * event registration item.
   *
   * @param {object} params
   */
  const onSubmitEventItem = async (params) => {
    setSaving(true);
    let url = `/events/${event?.id}/event-items`;
    let method = "POST";
    let requestParams = {};

    for (const [key, value] of Object.entries(params)) {
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

    /**
     * If its a POST request, need to attach
     * an event attendee type ID to request body.
     */
    if (!activeEventItem) {
      requestParams = {
        ...requestParams,
        event_attendee_type: activeAttendeeType?.id,
      };
    }

    if (activeEventItem) {
      url = `/events/${event?.id}/event-items/${activeEventItem?.id}`;
      method = "PUT";
    }

    try {
      const data = await api({
        url,
        method,
        data: { ...requestParams },
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(),
        },
      });

      setActiveAttendeeType(undefined);
      setActiveEventItem(undefined);
      setShowEventItemModal(false);
      router.push(router);
    } catch (e) {
      addToast("Failed to save event item", {
        appearance: "error",
        autoDismiss: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEventItemDelete = async () => {
    setEventItemDeleting(true);
    try {
      const data = await api({
        url: `/events/${event?.id}/event-items/${activeEventItem?.id}`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(),
        },
      });

      setActiveEventItem(undefined);
      setShowConfirmItemDelete(false);
      router.push(router);
    } catch (e) {
      addToast("Failed to delete event item", {
        appearance: "error",
        autoDismiss: true,
      });
    } finally {
      setEventItemDeleting(false);
    }
  };

  const handleCostUpdate = async (params) => {
    setSavingItemCost(true);
    try {
      const data = await api({
        url: `/events/${event?.id}/registration-costs/${activeItemCost?.id}`,
        method: "PUT",
        data: params,
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(),
        },
      });

      setActiveItemCost(undefined);
      setShowEventItemCostModal(false);
      router.push(router);
    } catch (e) {
      addToast("Failed to save event item cost", {
        appearance: "error",
        autoDismiss: true,
      });
    } finally {
      setSavingItemCost(false);
    }
  };

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
    <ContentErrorBoundary>
      <PageHeader title="Registration Cost" />
      {isShowEventItemModal && (
        <EventItemModal
          isShow={isShowEventItemModal}
          defaultValues={activeEventItem}
          isSaving={isSaving}
          onHide={() => {
            setShowEventItemModal(false);
            setActiveEventItem(undefined);
            setActiveAttendeeType(undefined);
          }}
          onSubmit={onSubmitEventItem}
        />
      )}
      {isShowEventItemCostModal && (
        <EventItemCostModal
          isShow={isShowEventItemCostModal}
          defaultValues={activeItemCost}
          isSaving={isSavingItemCost}
          onHide={() => {
            setShowEventItemCostModal(false);
            setActiveItemCost(undefined);
          }}
          onSubmit={handleCostUpdate}
        />
      )}
      {isShowConfirmItemDelete && (
        <PopupAlert
          danger
          showCancel
          confirmBtnText="Delete Event Item"
          confirmBtnBsStyle="danger"
          title="Delete Event Item"
          focusCancelBtn
          onConfirm={handleEventItemDelete}
          isLoading={isEventItemDeleting}
          onCancel={() => {
            setActiveEventItem(undefined);
            setShowConfirmItemDelete(false);
          }}
        >
          Are you sure you want to delete this event item? All the costs that
          are associated to this item will also be deleted.
        </PopupAlert>
      )}

      <Panel title="Registration Cost" color="inverse" maximizable collapsable>
        <Table
          columns={tableColumns}
          items={attendeeTypes}
          scopedSlots={scopedSlots}
          tdAlign="top"
          // responsive
          fixed
          bordered
        />
      </Panel>
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
        url: `/events/${context.params.eventId}`,
        headers,
      });

      const eventTimeFramesResponse = await api({
        url: `/events/${context.params.eventId}/time-frames`,
        headers,
      });

      const eventAttendeeTypesResponse = await api({
        url: `/events/${context.params.eventId}/attendee-types?withCostsData=1`,
        headers,
      });

      return {
        props: {
          session,
          context: await getContextProps(context),
          event: eventResponse.data.data,
          timeframes: eventTimeFramesResponse.data.data,
          attendeeTypes: eventAttendeeTypesResponse.data.data,
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

RegistrationCosts.Layout = ViewEventLayout;
RegistrationCosts.authorized = true;

export default RegistrationCosts;
