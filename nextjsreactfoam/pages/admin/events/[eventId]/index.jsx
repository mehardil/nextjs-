import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { getSession } from "next-auth/client";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useToasts } from "react-toast-notifications";
import classNames from "classnames";
import ComponentErrorBoundary from "@/components/common/ComponentErrorBoundary";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import EventDetailsWidget from "@/components/common/EventDetailsWidget";
import EventStatAddons from "@/components/common/EventStatAddons";
import ViewEventLayout from "@/components/layouts/ViewEventLayout";
import Panel from "@/components/ui/Panel";
import Progress from "@/components/ui/Progress";
import Widget from "@/components/ui/Widget";
import { useEventDispatch } from "@/contexts/EventContext";
import actionTypes from "@/contexts/action-types";
import paths from "@/routes/paths";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import interpolatePath from "@/utils/interpolatePath";
import localizeDate from "@/utils/localizeDate";
import { RemoveItemsId, StoreItemsCheck } from "@/utils/localStorageFunctions";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const EventDashboard = ({ event, session }) => {
  const { addToast } = useToasts();
  const t = useTranslations();
  const eventDispatch = useEventDispatch();
  const [addonStats, setAddonStats] = useState({ addon_counts: [] });
  const [submissionStats, setSubmissionStats] = useState({ week_counts: [] });
  const [accommodationStats, setAccommodationStats] = useState({
    week_counts: [],
  });
  const [sponsorshipIncomeStats, setSponsorshipIncomeStats] = useState({
    week_counts: [],
  });
  const [regoStats, setRegoStats] = useState({
    week_counts: [],
    type_counts: [],
  });

  const eventStats = [
    {
      key: "registrations_count",
      title: t("common.registered"),
      color: "teal",
      icon: "users",
      number: event?.registrations_count,
      linkText: t("common.forms.view"),
      link: interpolatePath(paths.ADMIN_EVT_REPORTS_DELEGATES_ALL, {
        eventId: event?.id,
      }),
    },
    {
      key: "unchecked_registrations_count",
      title: t("common.unchecked"),
      color: "red",
      icon: "times",
      number: event?.unchecked_registrations_count,
      linkText: t("common.forms.view"),
      link: interpolatePath(paths.ADMIN_EVT_REPORTS_DELEGATES_ALL, {
        eventId: event?.id,
        query: {
          isChecked: 0,
        },
      }),
    },
    {
      key: "incomplete_registrations_count",
      title: t("common.incomplete"),
      color: "orange",
      icon: "exclamation",
      number: event?.incomplete_registrations_count,
      linkText: t("common.forms.view"),
      link: interpolatePath(paths.ADMIN_EVT_REPORTS_DELEGATES_ALL, {
        eventId: event?.id,
        query: {
          isComplete: 0,
        },
      }),
    },
    {
      key: "submissions_count",
      title: t("common.submission", { entries: 1 }),
      color: "blue",
      icon: "arrow-alt-circle-right",
      number: event?.user_submissions_count,
      linkText: t("common.forms.view"),
      link: interpolatePath(paths.ADMIN_EVT_REPORTS_SUBMISSIONS, {
        eventId: event?.id,
      }),
    },
    {
      key: "accommodation_nights_count",
      title: t("common.accommodationNight", { entries: 1 }),
      color: "purple",
      icon: "suitcase",
      number: event?.accommodation_nights_count,
      linkText: t("common.forms.view"),
      link: interpolatePath(paths.ADMIN_EVT_REPORTS_ACCOMMODATIONS, {
        eventId: event?.id,
      }),
    },
  ];

  /**
   * Line chart of registration stats. Charts
   * should have its own request to avoid large inital data request.
   */
  const renderRegistrationStat = (
    <ComponentErrorBoundary>
      <Panel
        title={t("common.registration", { entries: 2 })}
        color="inverse"
        bodyless
        maximizable
        collapsable
      >
        <Line
          className="p-10"
          options={{ responsive: true }}
          data={{
            labels: Object.keys(regoStats.week_counts),
            datasets: [
              {
                label: t("common.entityCount", {
                  entity: t("common.registration", { entries: 2 }),
                }),
                borderColor: "rgb(255, 99, 132)",
                backgroundColor: "rgba(255, 99, 132, 0.5)",
                data: Object.values(regoStats.week_counts),
              },
            ],
          }}
        />
        {regoStats.type_counts && (
          <div className="list-group">
            {Object.entries(regoStats.type_counts).map(([key, count]) => (
              <Link
              href={{
                pathname: paths.DELEGATE_REGISTER,
                query: { eventId: event.id },
              }}
            >
                <div
                  key={key}
                  className="cursor-pointer list-group-item d-flex justify-content-between align-items-center text-ellipsis"
                >
                  {key}
                  <span className="badge f-w-500 bg-gradient-teal f-s-10">
                    {count}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Panel>
    </ComponentErrorBoundary>
  );

  const renderSubmissionStat = (
    <ComponentErrorBoundary>
      <Panel
        title={t("common.submission", { entries: 2 })}
        color="inverse"
        bodyless
        maximizable
        collapsable
      >
        <Line
          className="p-10"
          options={{ responsive: true }}
          data={{
            labels: Object.keys(submissionStats.week_counts),
            datasets: [
              {
                label: t("common.entityCount", {
                  entity: t("common.submission", { entries: 2 }),
                }),
                borderColor: "rgb(255, 99, 132)",
                backgroundColor: "rgba(255, 99, 132, 0.5)",
                data: Object.values(submissionStats.week_counts),
              },
            ],
          }}
        />
      </Panel>
    </ComponentErrorBoundary>
  );

  const renderSponsorshipIncomeStat = (
    <ComponentErrorBoundary>
      <Panel
        title={t("common.sponsorshipIncome")}
        color="inverse"
        bodyless
        maximizable
        collapsable
      >
        <Line
          className="p-10"
          options={{ responsive: true }}
          data={{
            labels: Object.keys(sponsorshipIncomeStats.week_counts),
            datasets: [
              {
                label: t("common.sponsorshipIncome"),
                borderColor: "rgb(255, 99, 132)",
                backgroundColor: "rgba(255, 99, 132, 0.5)",
                data: Object.values(sponsorshipIncomeStats.week_counts),
              },
            ],
          }}
        />
      </Panel>
    </ComponentErrorBoundary>
  );

  const renderAccommodationStat = (
    <ComponentErrorBoundary>
      <Panel
        title={t("common.accommodation", { entries: 2 })}
        color="inverse"
        bodyless
        maximizable
        collapsable
      >
        <Line
          className="p-10"
          options={{ responsive: true }}
          data={{
            labels: Object.keys(accommodationStats.week_counts),
            datasets: [
              {
                label: t("common.entityCount", {
                  entity: t("common.accommodation", { entries: 2 }),
                }),
                borderColor: "rgb(255, 99, 132)",
                backgroundColor: "rgba(255, 99, 132, 0.5)",
                data: Object.values(accommodationStats.week_counts),
              },
            ],
          }}
        />
      </Panel>
    </ComponentErrorBoundary>
  );

  const renderAddonStat = (
    <ComponentErrorBoundary>
      <EventStatAddons {...{ event }} />
    </ComponentErrorBoundary>
  );

  /**
   * Created a function to request for registration stats,
   * this may be called again when Chart Panel's "Reload" button of
   * Registration Stats is clicked.
   */
  const loadRegistrationStats = async () => {
    const response = await api({
      url: `/events/${event.id}/stats/registrations`,
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "X-Tenant": getTenant(),
      },
    });

    setRegoStats(response.data.data);
  };

  /**
   * Created a function to request for submission stats,
   * this may be called again when Chart Panel's "Reload" button of
   * Submission Stats is clicked.
   */
  const loadSubmissionStats = async () => {
    const response = await api({
      url: `/events/${event.id}/stats/submissions`,
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "X-Tenant": getTenant(),
      },
    });

    setSubmissionStats(response.data.data);
  };

  /**
   * Created a function to request for sponsorship income stats,
   * this may be called again when Chart Panel's "Reload" button of
   * Sponsorship Income Stats is clicked.
   */
  const loadSponsorshipIncomeStats = async () => {
    const response = await api({
      url: `/events/${event.id}/stats/sponsorships-income`,
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "X-Tenant": getTenant(),
      },
    });

    setSponsorshipIncomeStats(response.data.data);
  };

  /**
   * Created a function to request for accommodation stats,
   * this may be called again when Chart Panel's "Reload" button of
   * Accommodation Stats is clicked.
   */
  const loadAccommodationStats = async () => {
    const response = await api({
      url: `/events/${event.id}/stats/accommodations`,
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "X-Tenant": getTenant(),
      },
    });

    setAccommodationStats(response.data.data);
  };

  /**
   * Created a function to request for accommodation stats,
   * this may be called again when Chart Panel's "Reload" button of
   * Accommodation Stats is clicked.
   */
  const loadAddonStats = async () => {
    const response = await api({
      url: `/events/${event.id}/stats/addons`,
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "X-Tenant": getTenant(),
      },
    });

    setAddonStats(response.data.data);
  };

  /**
   * This useEffect will load all chart-related requests
   * initially. Will be called once.
   */
  useEffect(() => {
    loadRegistrationStats();
    loadSubmissionStats();
    loadSponsorshipIncomeStats();
    loadAccommodationStats();
    loadAddonStats();
  }, []);

  /**
   * Sets the event to be used for the entire event-related pages.
   * This must be implemented in every event page.
   */
  useEffect(() => {
    eventDispatch({
      type: actionTypes.SET_EVENT,
      payload: event,
    });
    if (StoreItemsCheck("event", event?.id)) {
      addToast("Event successfully created.", {
        appearance: "success",
        autoDismiss: true,
      });
      RemoveItemsId("event", event?.id);
    }
  }, [event]);
  //
  return (
    <ContentErrorBoundary>
      <EventDetailsWidget {...{ event }} />
      <div
        className="d-lg-flex flex-nowrap justify-content-between"
        style={{ gap: "12px" }}
      >
        {eventStats.map(({ key, ...stat }) => (
          <div key={key} className="flex-grow-1">
            <Widget.Stat {...stat} />
          </div>
        ))}
      </div>
      <hr className="m-t-0 bg-black-transparent-1" />
      <div className="row">
        <div className="col-md-4">{renderRegistrationStat}</div>
        <div className="col-md-4">
          {renderSubmissionStat}
          {renderSponsorshipIncomeStat}
        </div>
        <div className="col-md-4">
          {renderAccommodationStat}
          {renderAddonStat}
        </div>
      </div>
    </ContentErrorBoundary>
  );
};

export async function getServerSideProps(context) {
  const session = await getSession(context);

  if (session) {
    try {
      const response = await api({
        url: `/events/${context.params.eventId}?withBasicStats=1`,
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
}

EventDashboard.Layout = ViewEventLayout;

export default EventDashboard;
