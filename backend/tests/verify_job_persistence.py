import json
import urllib.request
from app.db.session import SessionLocal, DATABASE_URL
from app.models.models import Job

print("=== 1. DATABASE_URL / CONNECTION VERIFICATION ===")
print("Configured DATABASE_URL:", DATABASE_URL)

payload = {
    "title": "Autonomous AI Platform Architect",
    "company": "HireGenie AI Technologies",
    "department": "Architecture & Systems",
    "description": "Architecting enterprise autonomous agent hiring systems.",
    "location": "Bengaluru, India",
    "work_mode": "REMOTE",
    "employment_type": "FULL_TIME",
    "experience_level": "LEAD",
    "min_experience": 5.0,
    "max_experience": 10.0,
    "salary_disclosed": True,
    "salary_type": "ANNUAL",
    "currency": "INR",
    "min_salary": 800000.0,
    "max_salary": 1200000.0,
}

# 1. POST Create Job
req = urllib.request.Request(
    "http://localhost:8000/api/v1/jobs/",
    data=json.dumps(payload).encode("utf-8"),
    headers={"Content-Type": "application/json"}
)
resp = urllib.request.urlopen(req)
status_post = resp.status
created = json.loads(resp.read().decode())
job_id = created["id"]
print(f"\n=== 2. POST /api/v1/jobs/ ===")
print(f"Status Code: {status_post}")
print(f"Created Job ID: {job_id}")
print(f"Title: {created['title']}")
print(f"Status: {created['status']}")
print(f"Min Salary: {created['min_salary']}")
print(f"Max Salary: {created['max_salary']}")
print(f"Currency: {created['currency']}")
print(f"Salary Range: {created['salary_range']}")

# 2. GET /api/v1/jobs/{id}
get_resp = urllib.request.urlopen(f"http://localhost:8000/api/v1/jobs/{job_id}")
status_get_single = get_resp.status
single_job = json.loads(get_resp.read().decode())
print(f"\n=== 3. GET /api/v1/jobs/{job_id} ===")
print(f"Status Code: {status_get_single}")
print(f"ID: {single_job['id']}")
print(f"Title: {single_job['title']}")
print(f"Status: {single_job['status']}")
print(f"Min Salary: {single_job['min_salary']}")
print(f"Max Salary: {single_job['max_salary']}")
print(f"Currency: {single_job['currency']}")
print(f"Salary Range: {single_job['salary_range']}")

# 3. GET /api/v1/jobs/
list_resp = urllib.request.urlopen("http://localhost:8000/api/v1/jobs/")
status_get_list = list_resp.status
all_jobs = json.loads(list_resp.read().decode())
match = [j for j in all_jobs if j["id"] == job_id]
print(f"\n=== 4. GET /api/v1/jobs/ ===")
print(f"Status Code: {status_get_list}")
print(f"Total Jobs in List: {len(all_jobs)}")
print(f"Found Newly Created Job in List: {len(match) > 0}")
if match:
    m = match[0]
    print(f"Matched Job ID: {m['id']}")
    print(f"Title: {m['title']}")
    print(f"Status: {m['status']}")
    print(f"Min Salary: {m['min_salary']}")
    print(f"Max Salary: {m['max_salary']}")
    print(f"Currency: {m['currency']}")
    print(f"Salary Range: {m['salary_range']}")

# 4. Direct PostgreSQL Verification
db = SessionLocal()
db_record = db.query(Job).filter(Job.id == job_id).first()
print(f"\n=== 5. DIRECT POSTGRESQL QUERY (jobs table, ID={job_id}) ===")
print(f"Record Exists in PostgreSQL: {db_record is not None}")
if db_record:
    print(f"DB ID: {db_record.id}")
    print(f"DB Title: {db_record.title}")
    print(f"DB Status: {db_record.status}")
    print(f"DB Min Salary: {db_record.min_salary}")
    print(f"DB Max Salary: {db_record.max_salary}")
    print(f"DB Currency: {db_record.currency}")
    print(f"DB Salary Range: {db_record.salary_range}")
    print(f"DB Salary Disclosed: {db_record.salary_disclosed}")

# 5. Consistency Validation
assert status_post == 201, f"Expected 201, got {status_post}"
assert status_get_single == 200, f"Expected 200, got {status_get_single}"
assert len(match) == 1, "Job was not found in GET /api/v1/jobs/ list"
assert db_record is not None, "Job was not found in PostgreSQL"
assert created["min_salary"] == single_job["min_salary"] == m["min_salary"] == db_record.min_salary == 800000.0
assert created["max_salary"] == single_job["max_salary"] == m["max_salary"] == db_record.max_salary == 1200000.0
assert created["currency"] == single_job["currency"] == m["currency"] == db_record.currency == "INR"
assert created["status"] == single_job["status"] == m["status"] == db_record.status == "OPEN"
assert created["salary_range"] == single_job["salary_range"] == m["salary_range"] == db_record.salary_range == "INR 800,000 - 1,200,000 / Annual"

print("\n=== 6. RESULT: ALL 5 CHECKS VERIFIED & IDENTICAL ACROSS ALL SURFACES ===")
