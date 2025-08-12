const { gql, default: request } = require("graphql-request")

// CDN endpoint for fast read operations (existing)
const MASTER_URL='https://eu-west-2.cdn.hygraph.com/content/'+process.env.NEXT_PUBLIC_MASTER_URL_KEY+'/master'

// Management API endpoint for write operations (user-generated content)
const MANAGEMENT_URL = 'https://management-eu-west-2.hygraph.com/graphql'
const MANAGEMENT_TOKEN = process.env.HYGRAPH_MANAGEMENT_TOKEN

// Helper function for management API requests
const managementRequest = async (query, variables = {}) => {
  const headers = {
    Authorization: `Bearer ${MANAGEMENT_TOKEN}`,
    'Content-Type': 'application/json'
  }
  
  return await request(MANAGEMENT_URL, query, variables, headers)
}

const getCategory=async()=>{
    const query=gql`
    query Categories {
        categories {
          id
          name
          icon
          bgcolor
        }
      }
      `

      const result=await request(MASTER_URL,query)
    return result
}

const getAllBusinessList=async()=>{
    const query=gql`
    query BusinessList {
        businessLists {
          about
          address
          category {
            name
          }
          contactPerson
          email
          images {
            url
          }
          id
          name
        }
      }
      `
      const result=await request(MASTER_URL,query)
      return result;

}

const getBusinessByCategory=async(category)=>{
    const query=gql`
    query MyQuery {
        businessLists(where: {category: 
            {name: "`+category+`"}}) {
          about
          address
          category {
            name
          }
          contactPerson
          email
          id
          name
          images {
            url
          }
        }
      }
      `
      const result=await request(MASTER_URL,query)
      return result;
}

const getBusinessById=async(id)=>{
  const query=gql`
  query GetBusinessById {
    businessList(where: {id: "`+id+`"}) {
      about
      address
      category {
        name
      }
      contactPerson
      email
      id
      name
      images {
        url
      }
    }
  }
  `
  const result=await request(MASTER_URL,query)
      return result;
}

const createNewBooking=async(businessId,date,time,userEmail,userName)=>{
  const mutationQuery=gql`
  mutation CreateBooking {
    createBooking(
      data: {bookingStatus: Booked, 
        businessList: {connect: {id: "`+businessId+`"}},
         date: "`+date+`", time: "`+time+`", 
         userEmail: "`+userEmail+`",
          userName: "`+userName+`"}
    ) {
      id
    }
    publishManyBookings(to: PUBLISHED) {
      count
    }
  }
  `
  const result=await managementRequest(mutationQuery)
  return result;
}

const BusinessBookedSlot=async(businessId,date)=>{
  const query=gql`
  query BusinessBookedSlot {
    bookings(where: {businessList: 
      {id: "`+businessId+`"}, date: "`+date+`"}) {
      date
      time
    }
  }
  `
  const result=await request(MASTER_URL,query)
  return result;
}

const GetUserBookingHistory=async(userEmail)=>{
  const query=gql`
  query GetUserBookingHistory {
    bookings(where: {userEmail: "`+userEmail+`"}
    orderBy: publishedAt_DESC) {
      businessList {
        name
        images {
          url
        }
        contactPerson
        address
      }
      date
      time
      id
    }
  }
  `
  const result=await request(MASTER_URL,query)
  return result;

}

const deleteBooking=async(bookingId)=>{
  const mutationQuery=gql`
  mutation DeleteBooking {
    deleteBooking(where: {id: "`+bookingId+`"}) {
      id
    }
  }
  `
  const result=await managementRequest(mutationQuery)
  return result;
}

// NEW USER-GENERATED CONTENT FUNCTIONS

// Create business listing by service provider
const createBusinessListing=async(businessData)=>{
  const mutationQuery=gql`
  mutation CreateBusinessListing(
    $name: String!
    $about: String!
    $address: String!
    $email: String!
    $contactPerson: String!
    $categoryId: ID!
  ) {
    createBusinessList(
      data: {
        name: $name
        about: $about
        address: $address
        email: $email
        contactPerson: $contactPerson
        category: { connect: { id: $categoryId } }
        stage: DRAFT
      }
    ) {
      id
      name
      stage
    }
  }
  `
  const result=await managementRequest(mutationQuery, businessData)
  return result;
}

// Create user review
const createReview=async(reviewData)=>{
  const mutationQuery=gql`
  mutation CreateReview(
    $rating: Int!
    $comment: String!
    $userName: String!
    $userEmail: String!
    $businessId: ID!
  ) {
    createReview(
      data: {
        rating: $rating
        comment: $comment
        userName: $userName
        userEmail: $userEmail
        businessList: { connect: { id: $businessId } }
        stage: DRAFT
      }
    ) {
      id
      rating
      comment
    }
  }
  `
  const result=await managementRequest(mutationQuery, reviewData)
  return result;
}

// Update business status (for admin approval)
const updateBusinessStatus=async(businessId, status)=>{
  const mutationQuery=gql`
  mutation UpdateBusinessStatus($id: ID!, $stage: Stage!) {
    updateBusinessList(
      where: { id: $id }
      data: { stage: $stage }
    ) {
      id
      stage
    }
    
    publishBusinessList(where: { id: $id }) {
      id
    }
  }
  `
  const result=await managementRequest(mutationQuery, { 
    id: businessId, 
    stage: status === 'approved' ? 'PUBLISHED' : 'DRAFT' 
  })
  return result;
}

// Get pending businesses for admin approval
const getPendingBusinessListings=async()=>{
  const query=gql`
  query PendingBusinesses {
    businessLists(where: { stage: DRAFT }) {
      id
      name
      about
      address
      email
      contactPerson
      category {
        name
      }
      createdAt
    }
  }
  `
  const result=await request(MASTER_URL,query)
  return result;
}

export default{
    getCategory,
    getAllBusinessList,
    getBusinessByCategory,
    getBusinessById,
    createNewBooking,
    BusinessBookedSlot,
    GetUserBookingHistory,
    deleteBooking,
    
    // New user-generated content functions
    createBusinessListing,
    createReview,
    updateBusinessStatus,
    getPendingBusinessListings
}