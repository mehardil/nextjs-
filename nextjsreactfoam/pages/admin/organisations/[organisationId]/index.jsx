import React, { useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/client";
import { useRouter } from "next/router";
import Button from "@/components/ui/Button";
import { ADMIN } from "@/constants/roles";
import ViewOrganisationLayout from "@/components/layouts/ViewOrganisationLayout";
import Icon from "@/components/ui/Icon";
import Panel from "@/components/ui/Panel";
import Input from "@/components/ui/Input";
import FilterLayout from "@/components/layouts/FilterLayout";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import OrganisationReportSearchMemberTable from "@/components/common/OrganisationReportSearchMemberTable";
import OrganisationReportSearchAddonTable from "@/components/common/OrganisationReportSearchAddonTable";
import OrganisationReportHeader from "@/components/common/OrganisationReportHeader";
import { getSession } from "next-auth/client";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import api from "@/utils/api";
import actionTypes from "@/contexts/action-types";
import queryString from "query-string";
import { useOrganisationDispatch } from "@/contexts/OrganisationContext";
import localizeDate from "@/utils/localizeDate";
import Link from "next/link";
import paths, { MEMBER_MY_MEMBERSHIPS, MEMBERSHIP_LINK } from "@/routes/paths";
import Widget from "@/components/ui/Widget";
import { Line } from "react-chartjs-2";
import { useToasts } from "react-toast-notifications";

import ComponentErrorBoundary from "@/components/common/ComponentErrorBoundary";
import { RemoveItemsId, StoreItemsCheck } from "@/utils/localStorageFunctions";

const Summary = ({ organisation, context, ...props }) => {
  const organisationDispatch = useOrganisationDispatch();
  const { addToast } = useToasts();

  const [session, loading] = useSession();
  const router = useRouter();
  const t = useTranslations();
  const [orgMembershipStats, setOrgMembershipStats] = useState({
    week_counts: [],
    type_counts: [],
  });

  const orgStats = [
    {
      key: "current_members",
      title: "Current Members",
      color: "teal",
      icon: "users",
      number: organisation?.current_members_count,
      link: "http://test.com",
    },
    {
      key: "expiring_members",
      title: "Expiring Members",
      color: "orange",
      icon: "users",
      number: organisation?.expiring_members_count,
      link: "http://test.com",
    },
    {
      key: "expired_members",
      title: "Expired Members",
      color: "red",
      icon: "users",
      number: organisation?.expired_members_count,
      link: "http://test.com",
    },
    {
      key: "corporate_members",
      title: "Corporate Members",
      color: "blue",
      icon: "th-large",
      number: organisation?.corporate_members_count,
      link: "http://test.com",
    },
    {
      key: "submembers",
      title: "Submembers",
      color: "green",
      icon: "user",
      number: organisation?.submembers_count,
      link: "http://test.com",
    },
  ];

  React.useEffect(() => {
    organisationDispatch({
      type: actionTypes.SET_ORGANISATION,
      payload: organisation,
    });
    if (StoreItemsCheck("organisation", organisation?.id)) {
      addToast("Organisation successfully created.", {
        appearance: "success",
        autoDismiss: true,
      });
      RemoveItemsId("organisation", organisation?.id);
    }
  }, [organisation]);

  const renderRetiredMembersStat = (
    <ComponentErrorBoundary>
      <Panel
        title="Retired Members"
        color="inverse"
        bodyless
        maximizable
        collapsable
      >
        <div className="row p-10 mx-2 my-1">
          <div className="col-md-12">
            <div className="d-flex justify-content-between">
              <div>Age-retired 3 Year Membership</div>
              <span className="badge bg-teal rounded-pill">4</span>
            </div>
            <hr />
          </div>
          <div className="col-md-12">
            <div className="d-flex justify-content-between">
              <div>Age-retired 3 Year Membership</div>
              <span className="badge bg-teal rounded-pill">3</span>
            </div>
            <hr />
          </div>
        </div>
      </Panel>
    </ComponentErrorBoundary>
  );

  const renderProfessionalMembersStat = (
    <ComponentErrorBoundary>
      <Panel
        title="Professional Members"
        color="inverse"
        bodyless
        maximizable
        collapsable
      >
        <div className="row p-10 mx-2 my-1">
          <div className="col-md-12">
            <div className="d-flex justify-content-between">
              <div>Professional 3 Year Membership</div>
              <span className="badge bg-teal rounded-pill">2</span>
            </div>
            <hr />
          </div>
          <div className="col-md-12">
            <div className="d-flex justify-content-between">
              <div>Renewal Professional Membership</div>
              <span className="badge bg-teal rounded-pill">1</span>
            </div>
            <hr />
          </div>
        </div>
      </Panel>
    </ComponentErrorBoundary>
  );

  const renderGeneralMemberStat = (
    <ComponentErrorBoundary>
      <Panel
        title="General Member"
        color="inverse"
        bodyless
        maximizable
        collapsable
      >
        <div className="row p-10 mx-2 my-1">
          <div className="col-md-12">
            <div className="d-flex justify-content-between">
              <div>Life Member</div>
              <span className="badge bg-teal rounded-pill">30</span>
            </div>
            <hr />
          </div>
          <div className="col-md-12">
            <div className="d-flex justify-content-between">
              <div>New Regular 5 Year SRB Membership</div>
              <span className="badge bg-teal rounded-pill">1</span>
            </div>
            <hr />
          </div>
          <div className="col-md-12">
            <div className="d-flex justify-content-between">
              <div>New Regular SRB Membership</div>
              <span className="badge bg-teal rounded-pill">3</span>
            </div>
            <hr />
          </div>
          <div className="col-md-12">
            <div className="d-flex justify-content-between">
              <div>Overseas Membership (Exclude New Zealand)</div>
              <span className="badge bg-teal rounded-pill">10</span>
            </div>
            <hr />
          </div>
          <div className="col-md-12">
            <div className="d-flex justify-content-between">
              <div>New Regular 3 Year SRB Membership</div>
              <span className="badge bg-teal rounded-pill">12</span>
            </div>
            <hr />
          </div>
          <div className="col-md-12">
            <div className="d-flex justify-content-between">
              <div>Renewal Regular SRB Membership</div>
              <span className="badge bg-teal rounded-pill">8</span>
            </div>
            <hr />
          </div>
          <div className="col-md-12">
            <div className="d-flex justify-content-between">
              <div>SRB - NZ Membership</div>
              <span className="badge bg-teal rounded-pill">5</span>
            </div>
            <hr />
          </div>
          <div className="col-md-12">
            <div className="d-flex justify-content-between">
              <div>SSR Affiliate Membership to SRB</div>
              <span className="badge bg-teal rounded-pill">2</span>
            </div>
            <hr />
          </div>
        </div>
      </Panel>
    </ComponentErrorBoundary>
  );

  const renderMembershipsByYear = (
    <ComponentErrorBoundary>
      <Panel
        title="Memberships By Year"
        color="inverse"
        bodyless
        maximizable
        collapsable
      >
        <Line
          className="p-10"
          options={{ responsive: true }}
          data={{
            labels: Object.keys(orgMembershipStats.week_counts),
            datasets: [
              {
                label: t("common.entityCount", {
                  entity: t("common.registration", { entries: 2 }),
                }),
                borderColor: "rgb(255, 99, 132)",
                backgroundColor: "rgba(255, 99, 132, 0.5)",
                data: Object.values(orgMembershipStats.week_counts),
              },
            ],
          }}
        />
      </Panel>
    </ComponentErrorBoundary>
  );

  const renderStudentMemberStat = (
    <ComponentErrorBoundary>
      <Panel
        title="Student Member"
        color="inverse"
        bodyless
        maximizable
        collapsable
      >
        <div className="row p-10 mx-2 my-1">
          <div className="col-md-12">
            <div className="d-flex justify-content-between">
              <div>New SRB Student Membership</div>
              <span className="badge bg-teal rounded-pill">5</span>
            </div>
            <hr />
          </div>
          <div className="col-md-12">
            <div className="d-flex justify-content-between">
              <div>Renewal Student Membership</div>
              <span className="badge bg-teal rounded-pill">1</span>
            </div>
            <hr />
          </div>
          <div className="col-md-12">
            <div className="d-flex justify-content-between">
              <div>Student 2 Year Membership</div>
              <span className="badge bg-teal rounded-pill">1</span>
            </div>
            <hr />
          </div>
          <div className="col-md-12">
            <div className="d-flex justify-content-between">
              <div>Student 3 Year Membership</div>
              <span className="badge bg-teal rounded-pill">1</span>
            </div>
            <hr />
          </div>
        </div>
      </Panel>
    </ComponentErrorBoundary>
  );

  return (
    <ContentErrorBoundary>
      <PageHeader title="Summary" />
      <Panel
        title="Organisation Details"
        color="inverse"
        maximizable
        collapsable
      >
        <div className="row">
          <div className="col-md-12 mb-4">
            <div className="media">
              <div className="media-body">
                <h4 className="font-weight-bold media-heading">
                  {organisation?.long_name}
                </h4>
              </div>
            </div>
          </div>
          <div className="col-md-12">
            <b>Membership Link</b>
            <p>
              <Link
                href={{
                  pathname: paths.MEMBERSHIP_LINK,
                  query: { organisationId: organisation.id },
                }}
              >
                <a>{`${window.location.origin}/organisations/${organisation.id}/join`}</a>
              </Link>
            </p>
          </div>
          <div className="col-md-12">
            <b>Membership Dashboard</b>
            <p>
              <Link
                href={{
                  pathname: paths.MEMBER_DASHBOARD,
                  query: { organisationId: organisation.id },
                }}
              >
                <a>{`${window.location.origin}/organisations/${organisation.id}/memberships/dashboard`}</a>
              </Link>
            </p>
          </div>
        </div>
      </Panel>
      <div
        className="d-lg-flex flex-nowrap justify-content-between"
        style={{ gap: "12px" }}
      >
        {orgStats.map(({ key, ...stat }) => (
          <div key={key} className="flex-grow-1">
            <Widget.Stat {...stat} />
          </div>
        ))}
      </div>
      <hr className="m-t-0 bg-black-transparent-1" />
      <div className="row">
        <div className="col-md-6">{renderRetiredMembersStat}</div>
        <div className="col-md-6">{renderProfessionalMembersStat}</div>
        <div className="col-md-6">{renderGeneralMemberStat}</div>
        <div className="col-md-6">{renderMembershipsByYear}</div>
        <div className="col-md-12">{renderStudentMemberStat}</div>
      </div>
    </ContentErrorBoundary>
  );
};

export const getServerSideProps = async (context) => {
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
      const organisationResponse = await api({
        url: `/organisations/${context.query.organisationId}?withBasicStats=1`,
        headers,
      });

      return {
        props: {
          session,
          context: await getContextProps(context),
          organisation: organisationResponse.data.data,
        },
      };
    } catch (err) {
      return {
        notFound: true,
      };
    }
  }
};

Summary.authorized = true;
Summary.allowedRoles = [ADMIN];
Summary.Layout = ViewOrganisationLayout;
Summary.defaultProps = {
  Summarys: [],
};

export default Summary;
