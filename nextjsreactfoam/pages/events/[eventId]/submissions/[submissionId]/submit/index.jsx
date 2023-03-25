import React, { useEffect } from "react";
import { getSession, useSession } from "next-auth/client";
import { useForm, FormProvider } from "react-hook-form";
import { useToasts } from "react-toast-notifications";
import { useTranslations } from "next-intl";
import PageHeader from "@/components/common/PageHeader";
import ProfileForm from "@/components/forms/ProfileForm";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import Wizard from "@/components/ui/Wizard2";
import actionTypes from "@/contexts/action-types";
import { useGlobalDispatch } from "@/contexts/GlobalContext";
import getSubmissionSteps from "@/etc/submissionSteps";
import apiPaths from "@/routes/api";
import api from "@/utils/api";
import getContextProps from "@/utils/getContextProps";
import getTenant from "@/utils/getTenant";
import interpolatePath from "@/utils/interpolatePath";
import { withAuthUser, withEvent, withEventSubmission } from "@/utils/pipes";
import requestParamBuilder from "@/utils/requestParamBuilder";
import serverSidePipe from "@/utils/serverSidePipe";

const SubmissionProfilePage = ({
  submission,
  userSubmission,
  authUser,
  event,
}) => {
  const [session, loading] = useSession();

  const { addToast } = useToasts();
  const t = useTranslations();
  const methods = useForm({
    defaultValues: {
      ...authUser,
      extra_emails: authUser.extra_emails.map((ee) => ({
        label: ee.email,
        value: ee.email,
      })),
    },
  });
  const globalDispatch = useGlobalDispatch();
  const steps = getSubmissionSteps();

  const handleSubmit = async (params, { redirectToNextStep }) => {
    const headers = {
      Authorization: `Bearer ${session.accessToken}`,
      "X-Tenant": getTenant(),
    };

    const requestParams = requestParamBuilder(params, {
      formData: true,
      isPut: true,
    });

    try {
      await api({
        headers,
        method: "POST",
        data: requestParams,
        url: interpolatePath(apiPaths.USER, {
          userId: authUser?.id,
        }),
      });

      if (userSubmission?.id) {
        redirectToNextStep({
          query: {
            userSubmissionId: userSubmission?.id,
          },
        });
      } else {
        const userSubmission = await api({
          headers,
          method: "POST",
          url: interpolatePath(apiPaths.EVT_SUBMISSION_USER_SUBMISSIONS, {
            eventId: event?.id,
            submissionId: submission?.id,
          }),
        });
        redirectToNextStep({
          query: {
            userSubmissionId: userSubmission?.data?.data?.id,
          },
        });
      }
    } catch (e) {
      addToast(
        t("common.notifs.failedToUpdate", {
          entityName: "",
          entity: t("common.user", { entries: 1 }),
        }),
        {
          appearance: "error",
          autoDismiss: true,
        }
      );
    }
  };

  useEffect(() => {
    globalDispatch({
      type: actionTypes.SET_EVENT,
      payload: event,
    });
  }, [event, globalDispatch]);

  return (
    <FormProvider {...methods}>
      <Wizard
        {...{ steps }}
        onPrevious={({ redirectToPreviousStep }) => {
          redirectToPreviousStep({
            query: { userSubmissionId: userSubmission?.id },
          });
        }}
        disableNext={methods.watch()}
        onNext={({ redirectToNextStep }) =>
          methods.handleSubmit((params) =>
            handleSubmit(params, { redirectToNextStep })
          )()
        }
      >
        <ProfileForm fields={[ProfileForm.GENERAL_DETAILS]} />
      </Wizard>
    </FormProvider>
  );
};

export const getServerSideProps = (context) =>
  serverSidePipe(context, [withAuthUser, withEvent, withEventSubmission])(
    async (context, pipeProps) => {
      const session = await getSession(context);

      const headers = {
        Authorization: `Bearer ${session.accessToken}`,
        "X-Tenant": getTenant(context.req),
      };

      if (session) {
        if (context.query.userSubmissionId) {
          const userSubmissionResponse = await api({
            headers,
            url: interpolatePath(apiPaths.EVT_SUBMISSION_USER_SUBMISSION, {
              eventId: context.query.eventId,
              submissionId: context.query.submissionId,
              userSubmissionId: context.query.userSubmissionId,
            }),
          });

          return {
            props: {
              headers,
              session,
              context: await getContextProps(context),
              userSubmission: userSubmissionResponse.data.data,
              ...pipeProps,
            },
          };
        }

        return {
          props: {
            session,
            context: await getContextProps(context),
            ...pipeProps,
          },
        };
      }

      return {
        redirect: {
          source: context.req.headers.referer,
          destination: `/login?callbackUrl=${context.resolvedUrl}`,
          permanent: false,
        },
      };
    }
  );

SubmissionProfilePage.authorized = true;
SubmissionProfilePage.Layout = DashboardLayout;

export default SubmissionProfilePage;
