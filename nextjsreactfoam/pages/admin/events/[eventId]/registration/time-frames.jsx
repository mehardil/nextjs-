import React, { useState, useEffect } from "react";
import ViewEventLayout from "@/components/layouts/ViewEventLayout";
import { getSession } from "next-auth/client";
import queryString from "query-string";
import getTenant from "@/utils/getTenant";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import actionTypes from "@/contexts/action-types";
import { useTranslations } from "next-intl";
import { useEventDispatch } from "@/contexts/EventContext";
import PageHeader from "@/components/common/PageHeader";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import Table from "@/components/ui/Table";
import Panel from "@/components/ui/Panel";
import Button from "@/components/ui/Button";
import { useRouter } from "next/router";
import { useToasts } from "react-toast-notifications";
import Icon from "@/components/ui/Icon";
import EventTimeFrameModal from "@/components/modals/EventTimeFrameModal";
import EventTimeFrameHistoryModal from "@/components/modals/EventTimeFrameHistoryModal";
import localizeDate from "@/utils/localizeDate";
import PopupAlert from "@/components/ui/PopupAlert";

const TimeFrames = ({ event, eventTimeFrames, logHistoryResponse }) => {
  const router = useRouter();
  const t = useTranslations();
  const eventDispatch = useEventDispatch();
  const { addToast } = useToasts();
  const [showTimeFrameModal, setShowTimeFrameModal] = useState(false);
  const [showTimeFrameHistoryModal, setShowTimeFrameHistoryModal] =
    useState(false);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState(undefined);
  const [selectedTimeFrameHistory, setSelectedTimeFrameHistory] =
    useState(undefined);
  const [showDeletePopup, setShowDeletePopup] = useState(false);

  const [logHistory, setLogHistory] = useState();
  const regularTimeframe = {
    name: "Regular",
    start_time: event?.registration_open,
    end_time: event?.registration_end,
    start_time_timezone: event?.registration_timezone,
  };

  const columns = [
    { key: "name", label: "Name" },
    { key: "start_date", label: "Start Date" },
    { key: "end_date", label: "End Date" },
    { key: "timezone", label: "Timezone" },
    { key: "action", label: "Action" },
  ];

  const scopedSlots = {
    start_date: (item) => (
      <td>{item.start_time && localizeDate(item.start_time)}</td>
    ),
    end_date: (item) => <td>{item.end_time && localizeDate(item.end_time)}</td>,
    timezone: (item) => <td>{item.start_time_timezone}</td>,
    action: (timeFrame) => {
      if (!timeFrame?.id) {
        return <div />;
      }

      return (
        <Button.Dropdown
          size="xs"
          color="white"
          options={[
            {
              label: "Delete",
              onClick: () => {
                setSelectedTimeFrame(timeFrame);
                setShowDeletePopup(true);
              },
            },
            {
              label: "Log History",
              onClick: () => {
                handleTimeFramehistroy(timeFrame.id);
                setSelectedTimeFrameHistory(timeFrame);
                setShowTimeFrameHistoryModal(true);
              },
            },
          ]}
        >
          <Button
            onClick={() => {
              setSelectedTimeFrame(timeFrame);
              setShowTimeFrameModal(true);
            }}
          >
            Edit
          </Button>
        </Button.Dropdown>
      );
    },
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

  const handleDeleteTimeFrame = async (id) => {
    const session = await getSession();
    const headers = {
      Authorization: `Bearer ${session.accessToken}`,
      "X-Tenant": getTenant(),
    };

    api
      .delete(`/events/${event.id}/time-frames/${id}`, { headers })
      .then((res) => {
        addToast("Time Frame deleted successfully", {
          appearance: "success",
          autoDismiss: true,
        });
        refreshData();
      })
      .catch((err) => {
        addToast("Failed to delete time frame.", {
          appearance: "error",
          autoDismiss: true,
        });
      });
  };

  const handleTimeFramehistroy = async (id) => {
    const session = await getSession();
    const headers = {
      Authorization: `Bearer ${session.accessToken}`,
      "X-Tenant": getTenant(),
    };

    const logHistoryResponse = await api({
      url: `/events/${event.id}/timeframeshistory/${id}`,
      headers,
    });
    setLogHistory(logHistoryResponse);
  };

  const pageHeaderToolbar = (
    <Button color="primary" onClick={() => setShowTimeFrameModal(true)}>
      <Icon icon="plus" className="mr-1" />
      Add Time Frame
    </Button>
  );

  return (
    <ContentErrorBoundary>
      <PageHeader title="Time Frames" toolbar={pageHeaderToolbar} />
      <Panel title="Time Frames" color="inverse" maximizable collapsable>
        <Table
          items={[regularTimeframe, ...eventTimeFrames]}
          columns={columns}
          tableFilter={false}
          scopedSlots={scopedSlots}
          bordered
        />
      </Panel>
      {showTimeFrameModal && (
        <EventTimeFrameModal
          defaultValues={selectedTimeFrame}
          isShow={showTimeFrameModal}
          onHide={() => {
            setSelectedTimeFrame(undefined);
            setShowTimeFrameModal(false);
          }}
          onSubmit={() => {
            setShowTimeFrameModal(false);
            setSelectedTimeFrame(undefined);
            refreshData();
          }}
        />
      )}
      {showTimeFrameHistoryModal && logHistory && (
        <EventTimeFrameHistoryModal
          defaultValues={logHistoryResponse}
          logHistoryResponse={logHistory}
          isShow={showTimeFrameHistoryModal}
          onHide={() => {
            setSelectedTimeFrameHistory(undefined);
            setShowTimeFrameHistoryModal(false);
          }}
          onSubmit={() => {
            setShowTimeFrameHistoryModal(false);
            setSelectedTimeFrameHistory(undefined);
            refreshData();
          }}
        />
      )}
      {showDeletePopup && selectedTimeFrame?.id && (
        <PopupAlert
          danger
          showCancel
          confirmBtnText="Delete"
          type="danger"
          confirmBtnBsStyle="danger"
          title="Delete Confirmation"
          onConfirm={() => {
            handleDeleteTimeFrame(selectedTimeFrame?.id);
          }}
          onCancel={() => {
            setShowDeletePopup(false);
          }}
        >
          Are you sure you want to delete this time frame?
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
        url: `/events/${context.params.eventId}`,
        headers,
      });

      const eventTimeFramesResponse = await api({
        url: `/events/${context.params.eventId}/time-frames?sortBy=DateAdded`,
        headers,
      });

      return {
        props: {
          session,
          context: await getContextProps(context),
          event: eventResponse.data.data,
          eventTimeFrames: eventTimeFramesResponse.data.data,
        },
      };
    } catch (err) {
      return {
        notFound: true,
      };
    }
  }
}

TimeFrames.Layout = ViewEventLayout;

export default TimeFrames;
