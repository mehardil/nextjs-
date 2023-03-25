import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import PageHeader from "@/components/common/PageHeader";
import Panel from "@/components/ui/Panel";
import Table from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import { useTranslations } from "next-intl";
import ContentErrorBoundary from "@/components/common/ContentErrorBoundary";
import { useRouter } from "next/router";
import { getSession } from "next-auth/client";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import { useGlobalDispatch } from "@/contexts/GlobalContext";
import actionTypes from "@/contexts/action-types";

const MemberEvents = ({
  organisation,
  memberEvents,
  context,
  session,
  meta,
}) => {
  const t = useTranslations();
  const router = useRouter();
  const globalDispatch = useGlobalDispatch();
  //   const initialNumOfEntries = context.query.perPage;
  const [eventsList, seteventsList] = useState([
    {
      id: 1,
      short_name: "events one of attending the marriage ceremony",
      venue: "Melbourne Convocation and Exhibition Centre",
      location: "Melbourne, Victoria",
      dates: "14th-18th November 2010",
    },
    {
      id: 2,
      short_name: "events one of attending the marriage ceremony",
      venue: "Melbourne Convocation and Exhibition Centre",
      location: "Melbourne, Victoria",
      dates: "14th-18th November 2010",
    },
    {
      id: 3,
      short_name: "events one of attending the marriage ceremony",
      venue: "Melbourne Convocation and Exhibition Centre",
      location: "Melbourne, Victoria",
      dates: "14th-18th November 2010",
    },
  ]);
  const columns = [
    { key: "name", label: "Name" },
    { key: "venue", label: "Venue" },
    { key: "location", label: "Location" },
    { key: "dates", label: "Dates" },
    { key: "action", label: "Action" },
  ];
  const scopedSlots = {
    name: ({ id, short_name }) => <td>{short_name}</td>,
    venue: ({ id, venue }) => <td>{venue}</td>,
    location: ({ location }) => <td>{location}</td>,
    dates: ({ dates }) => <td>{dates}</td>,
    action: (item) => (
      <td className="m-4">
        <div className="d-flex">
          <Button.Dropdown>
            <Button>Edit</Button>
          </Button.Dropdown>
        </div>
      </td>
    ),
  };

  useEffect(() => {
    globalDispatch({
      type: actionTypes.SET_ORGANISATION,
      payload: organisation,
    });
  }, [organisation]);

  const refreshData = () => {
    router.replace(router.asPath);
  };

  const handlePageChange = ({ selected }) => {
    router.query.page = selected;
    router.push(router);
  };

  const handleKeywordChange = (keyword) => {
    router.query.keyword = keyword;
    router.push(router);
  };

  return (
    <ContentErrorBoundary>
      <PageHeader title="My Events" />
      <div className="row">
        <div className="col-md-12">
          <Panel
            title="Events I’m attending"
            color="inverse"
            maximizable
            collapsable
          >
            <Table
              items={eventsList}
              columns={columns}
              scopedSlots={scopedSlots}
              onPageChange={handlePageChange}
              //   initialKeyword={context.query.keyword}
              onKeywordChange={handleKeywordChange}
              batchActions={[]}
              bordered
              //   {...{ initialNumOfEntries }}
            />
          </Panel>
        </div>
      </div>
    </ContentErrorBoundary>
  );
};

export const getServerSideProps = async (context) => {
  const session = await getSession(context);

  const headers = {
    Authorization: `Bearer ${session.accessToken}`,
    "X-Tenant": getTenant(context.req),
  };

  if (session) {
    try {
      const organisationResponse = await api({
        url: `/organisations/${context.query.organisationId}`,
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

MemberEvents.authorized = true;
MemberEvents.Layout = DashboardLayout;
MemberEvents.defaultProps = {
  memberEvents: [],
};
export default MemberEvents;
