import PageLayout from "../../layouts/PageLayout";
import MembersList from "../../components/PageComponent/AdminMembersPage.jsx";

const Members = () => {
  return(
  <PageLayout title={'Members'}>
    <MembersList />
  </PageLayout>
  )
}

export default Members;