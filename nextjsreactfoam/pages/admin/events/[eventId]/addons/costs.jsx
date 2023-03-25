import React, { useState, useEffect } from "react";
import { useToasts } from "react-toast-notifications";
import { getSession } from "next-auth/client";
import { useRouter } from "next/router";
import { useTranslations } from "next-intl";
import classNames from "classnames";
import { map, uniqBy } from "lodash";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import EventAddonCostColumn from "@/components/common/EventAddonCostColumn";
import PageHeader from "@/components/common/PageHeader";
import ViewEventLayout from "@/components/layouts/ViewEventLayout";
import EventAddonCostModal from "@/components/modals/EventAddonCostModal";
import Button from "@/components/ui/Button";
import Panel from "@/components/ui/Panel";
import Table from "@/components/ui/Table";
import Tooltip from "@/components/ui/Tooltip";
import { ADMIN } from "@/constants/roles";
import actionTypes from "@/contexts/action-types";
import { useEventDispatch } from "@/contexts/EventContext";
import apiPaths from "@/routes/api";
import paths from "@/routes/paths";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import interpolatePath from "@/utils/interpolatePath";
import { withEvent } from "@/utils/pipes";
import requestParamBuilder from "@/utils/requestParamBuilder";
import serverSidePipe from "@/utils/serverSidePipe";
import context from "@/components/forPage/EventProgram/context";

const EventAddonCostsPage = ({
  attendeeTypes,
  eventItems,
  eventAddons,
  event,
  headers,
}) => {
  const t = useTranslations();
  const router = useRouter();
  const { addToast } = useToasts();
  const eventDispatch = useEventDispatch();
  const [activeAddonCost, setActiveAddonCost] = useState();
  const [showAddonCostModal, setShowAddonCostModal] = useState(false);
  const [isSavingAddonCost, setSavingAddonCost] = useState(false);

  let tableColumns = [
    {
      key: "type",
      label: "Attendee Category",
    },
    { key: "event_items", label: "Type" },
  ];

  eventAddons.forEach((eventAddon) => {
    tableColumns = tableColumns.concat([
      {
        key: `event_addon_${eventAddon.id}`,
        label: eventAddon.name,
      },
    ]);
  });

  let scopedSlots = {
    type: (attendeeType) => (
      <td className="position-relative">
        <span>{attendeeType.type}</span>
      </td>
    ),
    event_items: ({ event_addon_costs }) => {
      const eventItems = uniqBy(
        map(event_addon_costs, "event_item"),
        (item) => item.id
      );
      return (
        <td
          className={classNames("p-0 bg-grey-transparent-1", {
            "bg-white": !!eventItems.length,
          })}
          rowSpan={1}
        >
          {eventItems?.map((eventItem, index) => (
            <tr
              key={eventItem?.id}
              className={classNames("width-full d-block", {
                "b-b-1": eventItems?.length != index + 1,
              })}
            >
              <td className="b-0 ">
                <Tooltip message={eventItem.name}>{eventItem.name}</Tooltip>
              </td>
            </tr>
          ))}
        </td>
      );
    },
  };

  eventAddons.forEach((eventAddon) => {
    scopedSlots = Object.assign(scopedSlots, {
      [`event_addon_${eventAddon.id}`]: ({
        event_addon_costs,
        ...eventAttendeeType
      }) => {
        const eventItems = uniqBy(
          map(event_addon_costs, "event_item"),
          (item) => item.id
        );
        return (
          <td className="p-0 bg-grey-transparent-1">
            <EventAddonCostColumn
              eventAddon={eventAddon}
              eventItems={eventItems}
              eventAddonCosts={event_addon_costs}
              eventAttendeeType={eventAttendeeType}
              currency={event?.currency}
              onEdit={(eventAddonCost) => {
                setActiveAddonCost(eventAddonCost);
                setShowAddonCostModal(true);
              }}
            />
          </td>
        );
      },
    });
  });

  const onUpdateCost = async (params) => {
    setSavingAddonCost(true);
    try {
      const data = await api({
        headers,
        method: "PUT",
        data: params,
        url: interpolatePath(apiPaths.EVT_ADDON_COST, {
          eventId: event?.id,
          addonCostId: activeAddonCost?.id,
        }),
      });

      setActiveAddonCost(undefined);
      setShowAddonCostModal(false);
      router.push(router);
    } catch (e) {
      addToast("Failed to save event item cost", {
        appearance: "error",
        autoDismiss: true,
      });
    } finally {
      setSavingAddonCost(false);
    }
  };

  useEffect(() => {
    eventDispatch({
      type: actionTypes.SET_EVENT,
      payload: event,
    });
  }, [event, eventDispatch]);

  return (
    <ContentErrorBoundary>
      <PageHeader title="Addon Costs" />
      {showAddonCostModal && (
        <EventAddonCostModal
          defaultValues={activeAddonCost}
          isShow={showAddonCostModal}
          onHide={() => setShowAddonCostModal(false)}
          isSaving={isSavingAddonCost}
          onSubmit={onUpdateCost}
        />
      )}
      <Panel color="inverse" title="Costs" maximizable collapsable>
        <Table
          columns={tableColumns}
          items={attendeeTypes}
          scopedSlots={scopedSlots}
          tdAlign="top"
          fixed
          bordered
          responsive
        />
      </Panel>
    </ContentErrorBoundary>
  );
};

export const getServerSideProps = (context) =>
  serverSidePipe(context, [withEvent])(async (context, pipeProps) => {
    const session = await getSession(context);

    try {
      if (session) {
        const headers = {
          Authorization: `Bearer ${session.accessToken}`,
          "X-Tenant": getTenant(context.req),
        };

        const eventAttendeeTypesResponse = await api({
          headers,
          url: interpolatePath(apiPaths.EVT_ATTENDEE_TYPES, {
            eventId: context.params.eventId,
            query: {
              include:
                "eventAddonCosts,eventAddonCosts.eventAddon,eventAddonCosts.eventItem,eventAddonCosts.eventAttendeeType",
            },
          }),
        });

        const eventAddonsResponse = await api({
          headers,
          url: interpolatePath(apiPaths.EVT_ADDONS, {
            eventId: context.params.eventId,
          }),
        });

        return {
          props: {
            session,
            headers,
            context: await getContextProps(context),
            attendeeTypes: eventAttendeeTypesResponse.data.data,
            eventAddons: eventAddonsResponse.data.data,
            ...pipeProps,
          },
        };
      }
    } catch (e) {
      return {
        notFound: true,
      };
    }
  });

EventAddonCostsPage.authorized = true;
EventAddonCostsPage.allowedRoles = [ADMIN];
EventAddonCostsPage.Layout = ViewEventLayout;

export default EventAddonCostsPage;
